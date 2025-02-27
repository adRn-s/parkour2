from datetime import datetime

from authtools.models import AbstractEmailUser
from django.conf import settings
from django.db import models
from simple_history.models import HistoricalRecords


def get_deleted_org():
    return Organization.objects.get_or_create(name="deleted ORG")[0]


def get_deleted_pi():
    return PrincipalInvestigator.objects.get_or_create(name="deleted PI")[0]


class Organization(models.Model):
    name = models.CharField("Name", max_length=100)
    archived = models.BooleanField("Archived", default=False)
    history = HistoricalRecords()

    def __str__(self):
        return self.name


class PrincipalInvestigator(models.Model):
    name = models.CharField("Name", max_length=100)
    organization = models.ForeignKey(
        Organization, on_delete=models.SET(get_deleted_org)
    )
    email = models.EmailField("E-Mail Address", default="Unset")
    archived = models.BooleanField("Archived", default=False)
    history = HistoricalRecords()

    class Meta:
        verbose_name = "Principal Investigator"
        verbose_name_plural = "Principal Investigators"
        ordering = ["organization__name", "name"]

    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class CostUnit(models.Model):
    name = models.CharField("Name", max_length=100)
    archived = models.BooleanField("Archived", default=False)
    history = HistoricalRecords()
    pi = models.ForeignKey(
        PrincipalInvestigator,
        verbose_name="Principal Investigator",
        on_delete=models.SET(get_deleted_pi),
    )

    class Meta:
        verbose_name = "Cost Unit"
        verbose_name_plural = "Cost Units"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.pi.organization.name}: {self.pi.name})"


class User(AbstractEmailUser):
    first_name = models.CharField("First name", max_length=50)
    last_name = models.CharField("Last name", max_length=50)
    phone = models.CharField("Phone", max_length=50, null=True, blank=True)

    organization = models.ForeignKey(
        Organization,
        verbose_name="Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    pi = models.ForeignKey(
        PrincipalInvestigator,
        verbose_name="Principal Investigator",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    is_pi = models.BooleanField("PI Account", default=False)

    cost_unit = models.ManyToManyField(
        CostUnit,
        verbose_name="Cost Unit",
        blank=True,
    )

    class Meta:
        db_table = "auth_user"
        ordering = ["last_name", "first_name"]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def facility(self):
        if self.pi is None:
            membership = None
        elif self.pi.name == settings.BIOINFO:
            membership = "Bioinfo"
        elif self.pi.name == settings.DEEPSEQ:
            membership = "DeepSeq"
        else:
            membership = None
        return membership

    @property
    def paperless_approval(self):
        """
        This will return 'True' if both PI and User email addresses share the same host
        We'll be using email spoofing from within VM, the MTA was set by IT.
        """
        result_user = False
        result_pi = False
        if self.pi is not None and self.pi.email != "Unset":
            if (
                not ('"' in self.pi.email)
                and self.pi.email.split("@")[1] == settings.SERVER_EMAIL.split("@")[1]
            ):
                result_pi = True
            if (
                not ('"' in self.email)
                and self.email.split("@")[1] == settings.SERVER_EMAIL.split("@")[1]
            ):
                result_user = True
        return result_user and result_pi  # and not self.is_pi

    def __str__(self):
        this_user_email = self.email
        if not '"' in this_user_email:
            # email addresses are valid with more than one 'at' symbol, only if enquoted,
            # we avoid the following in such cases. See: https://stackoverflow.com/a/12355882
            if this_user_email.split("@")[1] == settings.SERVER_EMAIL.split("@")[1]:
                this_user_email = this_user_email.split("@")[0] + "@~"
        if self.phone is not None:
            this_user = (
                f"{self.first_name} {self.last_name} ({self.phone} | {this_user_email})"
            )
        else:
            this_user = f"{self.first_name} {self.last_name} ({this_user_email})"
        return this_user


class Duty(models.Model):
    main_name = models.ForeignKey(
        User,
        on_delete=models.deletion.CASCADE,
        related_name="main_name",
        verbose_name="Responsible Person",
    )
    backup_name = models.ForeignKey(
        User,
        on_delete=models.deletion.CASCADE,
        related_name="backup_name",
        verbose_name="Backup Person",
        null=True,
        blank=True,
    )
    start_date = models.DateTimeField(
        "Start Date",
        default=datetime.now,
    )
    end_date = models.DateTimeField(
        "End Date",
        null=True,
        blank=True,
    )
    platform = models.CharField(
        "Platform",
        choices=[("short", "Short"), ("long", "Long"), ("shortlong", "Short + Long")],
        default="short",
        max_length=15,
    )
    comment = models.TextField(
        "Comment",
        max_length=2500,
        null=True,
        blank=True,
    )
    archived = models.BooleanField("Archived", default=False)
    history = HistoricalRecords()

    class Meta:
        db_table = "duty"
        verbose_name = "Duty"
        verbose_name_plural = "Duties"
        ordering = ["end_date", "start_date"]


class DateTimeMixin(models.Model):
    create_time = models.DateTimeField("Create Time", auto_now_add=True)
    update_time = models.DateTimeField("Update Time", auto_now=True)

    class Meta:
        abstract = True
