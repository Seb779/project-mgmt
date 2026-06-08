"""
Routes pour la gestion des documents HERMES générés par IA.
GET    /documents                        — liste des documents générés
GET    /documents/{id}/download          — téléchargement du fichier Word
POST   /documents/generate               — génération directe depuis formulaire CP
GET    /documents/templates              — liste des templates (built-in + custom)
POST   /documents/templates/upload       — upload d'un template .docx custom
DELETE /documents/templates/{filename}   — supprime un template custom
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, SQLModel
from typing import List, Optional
from datetime import datetime
from pathlib import Path
import shutil

from app.core.database import get_session
from app.models.project import (
    Deliverable, DeliverableRead, DeliverableType, BucketStatus, ProjectPhase
)

router = APIRouter(prefix="/documents", tags=["documents"])

# Dossier des templates custom (volume persistant)
CUSTOM_TEMPLATES_DIR = Path("/app/uploads/templates")
BUILTIN_TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"


class TemplateInfo(SQLModel):
    filename: str
    name: str
    template_key: Optional[str]   # type HERMES associé
    is_custom: bool
    size_kb: float


class GenerateDocumentRequest(SQLModel):
    project_id: int
    template_key: str          # mandat_initialisation | mandat_projet | planning_jalons
    title: Optional[str] = None
    description: Optional[str] = None   # contexte additionnel pour l'IA
    custom_template_filename: Optional[str] = None  # utiliser un template custom


class GenerateDocumentResponse(SQLModel):
    deliverable_id: int
    document_path: str
    sections: dict
    generated_at: str


@router.get("/templates", response_model=List[TemplateInfo])
async def list_templates():
    """Liste tous les templates disponibles (built-in + custom uploadés)."""
    templates: List[TemplateInfo] = []

    # Built-in
    builtin_map = {
        "mandat_initialisation.docx": ("Mandat d'initialisation (défaut)", "mandat_initialisation"),
        "mandat_projet.docx":         ("Mandat de projet (défaut)",          "mandat_projet"),
        "planning_jalons.docx":       ("Planning avec jalons (défaut)",       "planning_jalons"),
    }
    for fname, (name, key) in builtin_map.items():
        p = BUILTIN_TEMPLATES_DIR / fname
        if p.exists():
            templates.append(TemplateInfo(
                filename=fname, name=name, template_key=key,
                is_custom=False, size_kb=round(p.stat().st_size / 1024, 1)
            ))

    # Custom
    CUSTOM_TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    for p in sorted(CUSTOM_TEMPLATES_DIR.glob("*.docx")):
        # Le nom du fichier encode : {template_key}___{display_name}.docx
        parts = p.stem.split("___", 1)
        tkey = parts[0] if len(parts) == 2 else None
        dname = parts[1] if len(parts) == 2 else p.stem
        templates.append(TemplateInfo(
            filename=p.name, name=dname, template_key=tkey,
            is_custom=True, size_kb=round(p.stat().st_size / 1024, 1)
        ))

    return templates


@router.post("/templates/upload", response_model=TemplateInfo)
async def upload_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    template_key: str = Form(...),   # mandat_initialisation | mandat_projet | planning_jalons
):
    """Upload un template Word custom (.docx)."""
    if not file.filename or not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers .docx sont acceptés")

    CUSTOM_TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

    # Nommage : {template_key}___{display_name}.docx (sans caractères spéciaux)
    safe_name = "".join(c for c in name if c.isalnum() or c in " -_").strip().replace(" ", "_")
    filename = f"{template_key}___{safe_name}.docx"
    dest = CUSTOM_TEMPLATES_DIR / filename

    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    return TemplateInfo(
        filename=filename, name=name, template_key=template_key,
        is_custom=True, size_kb=round(dest.stat().st_size / 1024, 1)
    )


@router.delete("/templates/{filename}", status_code=204)
async def delete_template(filename: str):
    """Supprime un template custom (les built-in ne peuvent pas être supprimés)."""
    path = CUSTOM_TEMPLATES_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Template non trouvé")
    path.unlink()


@router.get("", response_model=List[DeliverableRead])
async def list_documents(
    project_id: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
):
    """Liste tous les livrables de type HERMES_DOC (générés ou non)."""
    query = select(Deliverable).where(
        Deliverable.deliverable_type == DeliverableType.HERMES_DOC
    )
    if project_id:
        query = query.where(Deliverable.project_id == project_id)
    query = query.order_by(Deliverable.updated_at.desc())
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/generate", response_model=GenerateDocumentResponse)
async def generate_document(
    payload: GenerateDocumentRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Génère un document HERMES par IA.
    Crée d'abord un livrable, puis appelle le service IA (synchrone).
    """
    from app.models.project import Project
    # Vérifier que le projet existe
    project = await session.get(Project, payload.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    # Créer le livrable
    template_labels = {
        "mandat_initialisation": "Mandat d'initialisation",
        "mandat_projet": "Mandat de projet",
        "planning_jalons": "Planning avec jalons",
    }
    title = payload.title or template_labels.get(payload.template_key, payload.template_key)

    deliverable = Deliverable(
        project_id=payload.project_id,
        title=title,
        description=payload.description,
        deliverable_type=DeliverableType.HERMES_DOC,
        bucket_status=BucketStatus.IN_PROGRESS,
        phase=project.phase,
        hermes_template_key=payload.template_key,
        ai_generated=False,
        ai_sections_complete=0,
        ai_sections_total=0,
    )
    session.add(deliverable)
    await session.commit()
    await session.refresh(deliverable)

    # Résoudre le chemin du template
    custom_path = None
    if payload.custom_template_filename:
        custom_path = str(CUSTOM_TEMPLATES_DIR / payload.custom_template_filename)

    # Générer le document (synchrone)
    from app.services.ai_document_service import generate_hermes_document
    try:
        result = await generate_hermes_document(
            deliverable.id, payload.template_key, custom_template_path=custom_path
        )
    except Exception as e:
        # Mettre le livrable en erreur mais ne pas supprimer
        raise HTTPException(status_code=500, detail=f"Erreur génération IA : {str(e)}")

    # Recharger le livrable mis à jour
    await session.refresh(deliverable)

    return GenerateDocumentResponse(
        deliverable_id=deliverable.id,
        document_path=result.get("output_path", ""),
        sections=result.get("sections", {}),
        generated_at=datetime.utcnow().isoformat(),
    )


@router.get("/{deliverable_id}/download")
async def download_document(
    deliverable_id: int,
    session: AsyncSession = Depends(get_session),
):
    """Télécharge le fichier Word généré pour un livrable."""
    d = await session.get(Deliverable, deliverable_id)
    if not d:
        raise HTTPException(status_code=404, detail="Livrable non trouvé")
    if not d.document_path:
        raise HTTPException(status_code=404, detail="Document non encore généré")

    path = Path(d.document_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable sur le serveur")

    filename = f"{d.title.replace(' ', '_')}_{deliverable_id}.docx"
    return FileResponse(
        path=str(path),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
    )
