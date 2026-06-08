from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date, datetime
from enum import Enum
import uuid


class ProjectPhase(str, Enum):
    INITIALISATION = "initialisation"
    CONCEPTION = "conception"
    REALISATION = "realisation"
    DEPLOIEMENT = "deploiement"
    CLOTURE = "cloture"


class ProjectStatus(str, Enum):
    GREEN = "green"      # En bonne santé
    ORANGE = "orange"    # À surveiller
    RED = "red"          # En difficulté
    CLOSED = "closed"    # Clôturé


# ── Project ──────────────────────────────────────────────────────
class ProjectBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None
    client: str
    project_manager: str
    budget_chf: Optional[float] = None
    start_date: Optional[date] = None
    end_date_planned: Optional[date] = None
    phase: ProjectPhase = ProjectPhase.INITIALISATION
    status: ProjectStatus = ProjectStatus.GREEN
    progress_pct: int = Field(default=0, ge=0, le=100)
    next_milestone: Optional[str] = None
    next_milestone_date: Optional[date] = None


class Project(ProjectBase, table=True):
    __tablename__ = "projects"
    id: Optional[int] = Field(default=None, primary_key=True)
    uid: str = Field(default_factory=lambda: str(uuid.uuid4()), unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_archived: bool = False

    deliverables: List["Deliverable"] = Relationship(back_populates="project")


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    client: Optional[str] = None
    project_manager: Optional[str] = None
    budget_chf: Optional[float] = None
    start_date: Optional[date] = None
    end_date_planned: Optional[date] = None
    phase: Optional[ProjectPhase] = None
    status: Optional[ProjectStatus] = None
    progress_pct: Optional[int] = None
    next_milestone: Optional[str] = None
    next_milestone_date: Optional[date] = None


class ProjectRead(ProjectBase):
    id: int
    uid: str
    created_at: datetime
    updated_at: datetime
    is_archived: bool
    deliverables_count: Optional[int] = 0
    ai_docs_count: Optional[int] = 0


# ── Deliverable (Planner card) ───────────────────────────────────
class DeliverableType(str, Enum):
    HERMES_DOC = "hermes_doc"   # Livrable HERMES (déclencheur IA)
    MILESTONE = "milestone"
    TASK = "task"
    RISK = "risk"


class BucketStatus(str, Enum):
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    TO_VALIDATE = "to_validate"
    VALIDATED = "validated"
    ARCHIVED = "archived"


class DeliverableBase(SQLModel):
    title: str
    description: Optional[str] = None
    deliverable_type: DeliverableType = DeliverableType.TASK
    bucket_status: BucketStatus = BucketStatus.BACKLOG
    phase: ProjectPhase
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    hermes_template_key: Optional[str] = None   # ex: "mandat_initialisation"
    ai_generated: bool = False
    ai_sections_complete: int = 0
    ai_sections_total: int = 0


class Deliverable(DeliverableBase, table=True):
    __tablename__ = "deliverables"
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    document_path: Optional[str] = None   # chemin S3/local du .docx généré

    project: Optional[Project] = Relationship(back_populates="deliverables")


class DeliverableCreate(DeliverableBase):
    project_id: int


class DeliverableRead(DeliverableBase):
    id: int
    project_id: int
    created_at: datetime
    document_path: Optional[str] = None
