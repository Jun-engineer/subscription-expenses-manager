"""add vault_entries table

Revision ID: a1b2c3d4e5f6
Revises: 797b01e4d9d1
Create Date: 2025-04-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '797b01e4d9d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'vault_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('site_name', sa.Text(), nullable=False),
        sa.Column('site_url', sa.Text(), nullable=True),
        sa.Column('username', sa.Text(), nullable=False),
        sa.Column('encrypted_password', sa.Text(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_vault_user_created', 'vault_entries', ['user_id', 'created_at'])


def downgrade() -> None:
    op.drop_index('ix_vault_user_created', table_name='vault_entries')
    op.drop_table('vault_entries')
