# Generated by Django 4.2.9 on 2024-06-10 13:51

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("request", "0007_request_approval"),
    ]

    operations = [
        migrations.AlterField(
            model_name="request",
            name="description",
            field=models.TextField(default="Empty", verbose_name="Description"),
        ),
    ]
