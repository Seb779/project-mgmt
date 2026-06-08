from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List, Optional
from datetime import datetime

from app.core.database import get_session
from app.models.project import (
    Deliverable, DeliverableCreate, DeliverableRead,
    BucketStatus, DeliverableType
)

router = APIRouter(prefix="/deliverables", tags=["deliverables"])

# Règles de déclenchement IA : quand une card HERMES_DOC passe à ce statut → générer doc
AI_TRIGGER_RULES = {
    BucketStatus.IN_PROGRESS: False,
    BucketStatus.TO_VALIDATE: True,   # déclenchement à la validation
}


@router.get("/project/{project_id}", response_model=List[DeliverableRead])
async def list_deliverables(
    project_id: int,
    bucket_status: Optional[BucketStatus] = None,
    session: AsyncSession = Depends(get_session),
):
    query = select(Deliverable).where(Deliverable.project_id == project_id)
    if bucket_status:
        query = query.where(Deliverable.bucket_status == bucket_status)
    result = await session.execute(query.order_by(Deliverable.due_date.asc()))
    return result.scalars().all()


@router.post("/", response_model=DeliverableRead, status_code=201)
async def create_deliverable(
    payload: DeliverableCreate,
    session: AsyncSession = Depends(get_session),
):
    deliverable = Deliverable(**payload.model_dump())
    session.add(deliverable)
    await session.commit()
    await session.refresh(deliverable)
    return deliverable


@router.patch("/{deliverable_id}/status")
async def update_bucket_status(
    deliverable_id: int,
    new_status: BucketStatus,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    """
    Déplace une card vers un nouveau bucket.
    Si la card est un HERMES_DOC et que la règle le prévoit → déclenche la génération IA.
    """
    d = await session.get(Deliverable, deliverable_id)
    if not d:
        raise HTTPException(status_code=404, detail="Livrable non trouvé")

    old_status = d.bucket_status
    d.bucket_status = new_status
    d.updated_at = datetime.utcnow()
    session.add(d)
    await session.commit()
    await session.refresh(d)

    # Déclenchement IA en arrière-plan
    should_trigger = (
        d.deliverable_type == DeliverableType.HERMES_DOC
        and AI_TRIGGER_RULES.get(new_status, False)
        and d.hermes_template_key is not None
    )
    if should_trigger:
        background_tasks.add_task(
            trigger_ai_document_generation, deliverable_id, d.hermes_template_key
        )
        return {
            "id": d.id,
            "bucket_status": new_status,
            "ai_triggered": True,
            "message": f"Génération IA déclenchée pour '{d.title}'"
        }

    return {"id": d.id, "bucket_status": new_status, "ai_triggered": False}


async def trigger_ai_document_generation(deliverable_id: int, template_key: str):
    """
    Tâche arrière-plan : appelle le service IA pour générer le document HERMES.
    Sera remplacé par une tâche Celery en production.
    """
    from app.services.ai_document_service import generate_hermes_document
    await generate_hermes_document(deliverable_id, template_key)
