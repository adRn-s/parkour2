# Generated by Django 4.2.16 on 2024-11-04 16:08

from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import simple_history.models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("library_sample_shared", "0012_organism_alias_label_organism_snakepipes_yaml"),
    ]

    operations = [
        migrations.AlterField(
            model_name="indexpair",
            name="char_coord",
            field=models.CharField(
                max_length=1,
                validators=[
                    django.core.validators.RegexValidator(
                        "^[A-Z]$", "Only capital alphabetical characters are allowed."
                    )
                ],
                verbose_name="Character Coordinate",
            ),
        ),
        migrations.CreateModel(
            name="HistoricalOrganism",
            fields=[
                (
                    "id",
                    models.BigIntegerField(
                        auto_created=True, blank=True, db_index=True, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=100, verbose_name="Name")),
                (
                    "label",
                    models.CharField(
                        blank=True, max_length=25, null=True, verbose_name="Label"
                    ),
                ),
                (
                    "yaml",
                    models.CharField(
                        blank=True, max_length=200, null=True, verbose_name="YAML"
                    ),
                ),
                (
                    "scientific_name",
                    models.CharField(
                        blank=True,
                        max_length=150,
                        null=True,
                        verbose_name="Scientific Name",
                    ),
                ),
                (
                    "taxon_id",
                    models.PositiveIntegerField(
                        blank=True, null=True, verbose_name="Taxon Identifier"
                    ),
                ),
                (
                    "archived",
                    models.BooleanField(default=False, verbose_name="Archived"),
                ),
                ("history_id", models.AutoField(primary_key=True, serialize=False)),
                ("history_date", models.DateTimeField(db_index=True)),
                ("history_change_reason", models.CharField(max_length=100, null=True)),
                (
                    "history_type",
                    models.CharField(
                        choices=[("+", "Created"), ("~", "Changed"), ("-", "Deleted")],
                        max_length=1,
                    ),
                ),
                (
                    "history_user",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "historical organism",
                "verbose_name_plural": "historical organisms",
                "ordering": ("-history_date", "-history_id"),
                "get_latest_by": ("history_date", "history_id"),
            },
            bases=(simple_history.models.HistoricalChanges, models.Model),
        ),
        migrations.CreateModel(
            name="HistoricalLibraryType",
            fields=[
                (
                    "id",
                    models.BigIntegerField(
                        auto_created=True, blank=True, db_index=True, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=200, verbose_name="Name")),
                (
                    "archived",
                    models.BooleanField(default=False, verbose_name="Archived"),
                ),
                ("history_id", models.AutoField(primary_key=True, serialize=False)),
                ("history_date", models.DateTimeField(db_index=True)),
                ("history_change_reason", models.CharField(max_length=100, null=True)),
                (
                    "history_type",
                    models.CharField(
                        choices=[("+", "Created"), ("~", "Changed"), ("-", "Deleted")],
                        max_length=1,
                    ),
                ),
                (
                    "history_user",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "historical Library Type",
                "verbose_name_plural": "historical Library Types",
                "ordering": ("-history_date", "-history_id"),
                "get_latest_by": ("history_date", "history_id"),
            },
            bases=(simple_history.models.HistoricalChanges, models.Model),
        ),
        migrations.CreateModel(
            name="HistoricalLibraryProtocol",
            fields=[
                (
                    "id",
                    models.BigIntegerField(
                        auto_created=True, blank=True, db_index=True, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=150, verbose_name="Name")),
                (
                    "type",
                    models.CharField(
                        choices=[("DNA", "DNA"), ("RNA", "RNA"), ("Cells", "Cells")],
                        default="DNA",
                        max_length=5,
                        verbose_name="Type",
                    ),
                ),
                ("provider", models.CharField(max_length=150, verbose_name="Provider")),
                ("catalog", models.CharField(max_length=150, verbose_name="Catalog")),
                (
                    "explanation",
                    models.CharField(max_length=250, verbose_name="Explanation"),
                ),
                (
                    "input_requirements",
                    models.CharField(max_length=150, verbose_name="Input Requirements"),
                ),
                (
                    "typical_application",
                    models.CharField(
                        max_length=200, verbose_name="Typical Application"
                    ),
                ),
                (
                    "status",
                    models.PositiveIntegerField(default=1, verbose_name="Status"),
                ),
                (
                    "comments",
                    models.TextField(blank=True, null=True, verbose_name="Comments"),
                ),
                (
                    "archived",
                    models.BooleanField(default=False, verbose_name="Archived"),
                ),
                ("history_id", models.AutoField(primary_key=True, serialize=False)),
                ("history_date", models.DateTimeField(db_index=True)),
                ("history_change_reason", models.CharField(max_length=100, null=True)),
                (
                    "history_type",
                    models.CharField(
                        choices=[("+", "Created"), ("~", "Changed"), ("-", "Deleted")],
                        max_length=1,
                    ),
                ),
                (
                    "history_user",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "historical Library Protocol",
                "verbose_name_plural": "historical Library Protocols",
                "ordering": ("-history_date", "-history_id"),
                "get_latest_by": ("history_date", "history_id"),
            },
            bases=(simple_history.models.HistoricalChanges, models.Model),
        ),
    ]
