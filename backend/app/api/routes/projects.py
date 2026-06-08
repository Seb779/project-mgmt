from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_session
from app.models.project import (
    Project, ProjectCreate, ProjectRead, ProjectUpdate,
    ProjectStatus, ProjectPhase, Deliverable
)

router = APIRouter(prefix="/projects", tags=["projects"])


# ── Liste projets (portefeuille) ─────────────────────────────────
@router.get("", response_model=List[ProjectRead])
async def list_projects(
    status: Optional[ProjectStatus] = None,
    phase: Optional[ProjectPhase] = None,
    project_manager: Optional[str] = None,
    archived: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    session: AsyncSession = Depends(get_session),
):
    query = select(Project).where(Project.is_archived == archived)
    if status:
        query = query.where(Project.status == status)
    if phase:
        query = query.where(Project.phase == phase)
    if project_manager:
        query = query.where(Project.project_manager.ilike(f"%{project_manager}%"))
    query = query.offset(skip).limit(limit).order_by(Project.updated_at.desc())

    result = await session.execute(query)
    projects = result.scalars().all()

    # Enrichir avec le compte de livrables
    project_reads = []
    for p in projects:
        del_q = await session.execute(
            select(func.count(Deliverable.id)).where(Deliverable.project_id == p.id)
        )
        ai_q = await session.execute(
            select(func.count(Deliverable.id)).where(
                Deliverable.project_id == p.id,
                Deliverable.ai_generated == True
            )
        )
        pr = ProjectRead(**p.model_dump())
        pr.deliverables_count = del_q.scalar_one()
        pr.ai_docs_count = ai_q.scalar_one()
        project_reads.append(pr)

    return project_reads


# ── KPI portefeuille ─────────────────────────────────────────────
@router.get("/kpis")
async def portfolio_kpis(session: AsyncSession = Depends(get_session)):
    total = await session.execute(
        select(func.count(Project.id)).where(Project.is_archived == False)
    )
    green = await session.execute(
        select(func.count(Project.id)).where(
            Project.status == ProjectStatus.GREEN, Project.is_archived == False
        )
    )
    orange = await session.execute(
        select(func.count(Project.id)).where(
            Project.status == ProjectStatus.ORANGE, Project.is_archived == False
        )
    )
    red = await session.execute(
        select(func.count(Project.id)).where(
            Project.status == ProjectStatus.RED, Project.is_archived == False
        )
    )
    ai_docs = await session.execute(
        select(func.count(Deliverable.id)).where(Deliverable.ai_generated == True)
    )
    return {
        "total_active": total.scalar_one(),
        "green": green.scalar_one(),
        "orange": orange.scalar_one(),
        "red": red.scalar_one(),
        "ai_docs_generated": ai_docs.scalar_one(),
    }


# ── Créer un projet ───────────────────────────────────────────────
@router.post("", response_model=ProjectRead, status_code=201)
async def create_project(
    payload: ProjectCreate,
    session: AsyncSession = Depends(get_session),
):
    project = Project(**payload.model_dump())
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return ProjectRead(**project.model_dump())


# ── Lire un projet ────────────────────────────────────────────────
@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: int, session: AsyncSession = Depends(get_session)):
    project = await session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return ProjectRead(**project.model_dump())


# ── Mettre à jour un projet ───────────────────────────────────────
@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    session: AsyncSession = Depends(get_session),
):
    project = await session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
    project.updated_at = datetime.utcnow()

    session.add(project)
    await session.commit()
    await session.refresh(project)
    return ProjectRead(**project.model_dump())


# ── Archiver un projet ────────────────────────────────────────────
@router.delete("/{project_id}", status_code=204)
async def archive_project(project_id: int, session: AsyncSession = Depends(get_session)):
    project = await session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    project.is_archived = True
    project.updated_at = datetime.utcnow()
    session.add(project)
    await session.commit()
