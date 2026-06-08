"""
Routes pour la gestion des documents HERMES générés par IA.
GET  /documents             — liste des documents générés
GET  /documents/{id}/download — téléchargement du fichier Word
POST /documents/generate    — génération directe depuis formulaire CP
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, SQLModel
from typing import List, Optional
from datetime import datetime
from pathlib import Path

from app.core.database import get_session
from app.models.project import (
    Deliverable, DeliverableRead, DeliverableType, BucketStatus, ProjectPhase
)

router = APIRouter(prefix="/documents", tags=["documents"])


class GenerateDocumentRequest(SQLModel):
    project_id: int
    template_key: str          # mandat_initialisation | mandat_projet | planning_jalons
    title: Optional[str] = None
    description: Optional[str] = None   # contexte additionnel pour l'IA


class GenerateDocumentResponse(SQLModel):
    deliverable_id: int
    document_path: str
    sections: dict
    generated_at: str


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

    # Générer le document (synchrone)
    from app.services.ai_document_service import generate_hermes_document
    try:
        result = await generate_hermes_document(deliverable.id, payload.template_key)
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
