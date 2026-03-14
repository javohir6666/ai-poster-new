from __future__ import annotations

from django.core.management.base import BaseCommand

from ...models import AIModel


class Command(BaseCommand):
    help = "Seeds default AI models (Gemini/OpenAI) into the database."

    def handle(self, *args, **options):
        defaults = [
            # Backward-compatible names that may already exist in DB
            ("Gemini Pro", "gemini", "gemini-1.5-pro"),
            ("ChatGPT 5.2", "openai", "gpt-4o-mini"),

            # Prefer newer models for new API keys.
            ("Gemini 2.5 Flash", "gemini", "gemini-2.5-flash"),
            ("Gemini 1.5 Pro", "gemini", "gemini-1.5-pro"),
            ("GPT-4o mini", "openai", "gpt-4o-mini"),
        ]

        created = 0
        for name, provider, model in defaults:
            obj, was_created = AIModel.objects.get_or_create(
                name=name,
                defaults={"provider": provider, "model": model, "is_active": True},
            )
            if not was_created and (obj.provider != provider or obj.model != model):
                obj.provider = provider
                obj.model = model
                obj.is_active = True
                obj.save(update_fields=["provider", "model", "is_active"])
            if was_created:
                created += 1

        # Migrate older/deprecated Gemini model ids if present.
        AIModel.objects.filter(provider="gemini", model="gemini-2.0-flash").update(model="gemini-2.5-flash")
        AIModel.objects.filter(name="Gemini 2.0 Flash").update(provider="gemini", model="gemini-2.5-flash", is_active=True)

        self.stdout.write(self.style.SUCCESS(f"Seeded AI models. Created: {created}"))
