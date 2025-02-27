# Generated by Django 1.10.6 on 2017-11-21 10:36

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("sample", "0001_initial"),
        ("library", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Pooling",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "concentration_c1",
                    models.FloatField(
                        blank=True, null=True, verbose_name="Concentration C1"
                    ),
                ),
                (
                    "library",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="library.Library",
                        verbose_name="Library",
                    ),
                ),
                (
                    "sample",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="sample.Sample",
                        verbose_name="Sample",
                    ),
                ),
                (
                    "create_time",
                    models.DateTimeField(auto_now_add=True, verbose_name="Create Time"),
                ),
                (
                    "update_time",
                    models.DateTimeField(auto_now=True, verbose_name="Update Time"),
                ),
            ],
            options={
                "verbose_name": "Pooling",
                "verbose_name_plural": "Pooling",
            },
        ),
    ]
