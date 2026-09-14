"""Initial SmartFarm AI PostgreSQL schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-09-14 13:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('user_id', sa.String(length=64), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('preferred_language', sa.String(length=10), server_default='en', nullable=False),
        sa.Column('farm_location', sa.String(length=255), nullable=True),
        sa.Column('farm_details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index('ix_users_user_id', 'users', ['user_id'], unique=True)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. Create fields table
    op.create_table(
        'fields',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_type', sa.String(length=100), nullable=True),
        sa.Column('soil_type', sa.String(length=100), nullable=True),
        sa.Column('soil_ph', sa.Float(), nullable=True),
        sa.Column('water_capacity', sa.String(length=50), nullable=True),
        sa.Column('field_size', sa.Float(), nullable=True),
        sa.Column('field_size_unit', sa.String(length=50), nullable=True),
        sa.Column('npk_nitrogen', sa.Integer(), nullable=True),
        sa.Column('npk_phosphorus', sa.Integer(), nullable=True),
        sa.Column('npk_potassium', sa.Integer(), nullable=True),
        sa.Column('sowing_date', sa.String(length=50), nullable=True),
        sa.Column('irrigation_method', sa.String(length=100), nullable=True),
        sa.Column('field_location', sa.String(length=255), nullable=True),
        sa.Column('season', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index('ix_fields_user_id', 'fields', ['user_id'])

    # 3. Create disease_predictions table
    op.create_table(
        'disease_predictions',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.user_id', ondelete='SET NULL'), nullable=True),
        sa.Column('crop', sa.String(length=100), nullable=False),
        sa.Column('predicted_disease', sa.String(length=255), nullable=True),
        sa.Column('disease_clean', sa.String(length=255), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('confidence_percent', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='success', nullable=False),
        sa.Column('model_used', sa.String(length=100), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('leaf_crop_url', sa.String(length=500), nullable=True),
        sa.Column('top3_predictions', sa.JSON(), nullable=True),
        sa.Column('lime_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index('ix_disease_predictions_user_id', 'disease_predictions', ['user_id'])
    op.create_index('ix_disease_predictions_created_at', 'disease_predictions', ['created_at'])

    # 4. Create ai_reports table
    op.create_table(
        'ai_reports',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.user_id', ondelete='SET NULL'), nullable=True),
        sa.Column('prediction_id', sa.String(length=64), sa.ForeignKey('disease_predictions.id', ondelete='CASCADE'), nullable=True),
        sa.Column('language', sa.String(length=10), server_default='en', nullable=False),
        sa.Column('report_title', sa.String(length=255), nullable=True),
        sa.Column('advisory_text', sa.Text(), nullable=True),
        sa.Column('rag_sources', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index('ix_ai_reports_user_id', 'ai_reports', ['user_id'])
    op.create_index('ix_ai_reports_prediction_id', 'ai_reports', ['prediction_id'])
    op.create_index('ix_ai_reports_created_at', 'ai_reports', ['created_at'])


def downgrade() -> None:
    op.drop_table('ai_reports')
    op.drop_table('disease_predictions')
    op.drop_table('fields')
    op.drop_table('users')
