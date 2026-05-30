"""add confidence_score

Revision ID: 9b1f2c5c1a2d
Revises: e6cfb8097ba0
Create Date: 2026-05-30 10:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9b1f2c5c1a2d'
down_revision = 'e6cfb8097ba0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('prediction_history', sa.Column('confidence_score', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('prediction_history', 'confidence_score')
