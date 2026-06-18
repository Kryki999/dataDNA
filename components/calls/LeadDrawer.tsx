"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { PREDEFINED_LEAD_TAGS } from "@/lib/constants";
import {
  createLead,
  deleteLead,
  logColdCall,
  updateLead,
} from "@/lib/actions/leads";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { leads } from "@/lib/db/schema";

type Lead = typeof leads.$inferSelect;

type LeadDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onUpdated: (lead: Lead) => void;
  onDeleted: (leadId: string) => void;
};

const TEMPERATURES = [
  { value: "cold" as const, label: "Zimny", className: "border-sky-300 bg-sky-50 text-sky-700" },
  { value: "warm" as const, label: "Ciepły", className: "border-amber-300 bg-amber-50 text-amber-700" },
  { value: "hot" as const, label: "Gorący", className: "border-rose-300 bg-rose-50 text-rose-700" },
];

export function LeadDrawer(props: LeadDrawerProps) {
  const formKey = props.open ? (props.lead?.id ?? "new") : "closed";

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <LeadDrawerForm key={formKey} {...props} />
    </Sheet>
  );
}

function LeadDrawerForm({
  open,
  onOpenChange,
  lead,
  onUpdated,
  onDeleted,
}: LeadDrawerProps) {
  const isMobile = useIsMobile();
  const [name, setName] = useState(lead?.name ?? "");
  const [company, setCompany] = useState(lead?.company ?? "");
  const [phone, setPhone] = useState(lead?.phone ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [temperature, setTemperature] = useState<"cold" | "warm" | "hot">(
    lead?.temperature ?? "cold",
  );
  const [notes, setNotes] = useState(lead?.notes ?? "");
  const [tags, setTags] = useState<string[]>(lead?.tags ?? []);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  function handleSave() {
    if (!name.trim()) return;

    startTransition(async () => {
      if (lead) {
        const updated = await updateLead(lead.id, {
          name,
          company,
          phone,
          email,
          temperature,
          notes,
          tags,
        });
        if (updated) onUpdated(updated);
      } else {
        const created = await createLead({
          name,
          company,
          phone,
          email,
          temperature,
          notes,
          tags,
        });
        onUpdated(created);
      }
      onOpenChange(false);
    });
  }

  function handleLogCall() {
    if (!lead) return;

    startTransition(async () => {
      await updateLead(lead.id, {
        name,
        company,
        phone,
        email,
        temperature,
        notes,
        tags,
      });
      await logColdCall(lead.id);
      onUpdated({
        ...lead,
        name,
        company: company || null,
        phone: phone || null,
        email: email || null,
        temperature,
        notes,
        tags,
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  function handleDelete() {
    if (!lead) return;
    startTransition(async () => {
      await deleteLead(lead.id);
      onDeleted(lead.id);
    });
  }

  return (
    <SheetContent
      side={isMobile ? "bottom" : "right"}
      className={cn(
        "overflow-y-auto",
        isMobile
          ? "max-h-[92dvh] w-full rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
          : "w-full sm:max-w-md",
      )}
    >
      <SheetHeader>
        <SheetTitle>{lead ? "Edytuj kontakt" : "Nowy kontakt"}</SheetTitle>
      </SheetHeader>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Imię / nazwa</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jan Kowalski"
          />
        </div>

        <div className={cn("grid gap-3", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          <div className="space-y-2">
            <Label htmlFor="company">Firma</Label>
            <Input
              id="company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Temperatura</Label>
          <div className="flex flex-wrap gap-2">
            {TEMPERATURES.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant="outline"
                className={cn(
                  temperature === item.value && item.className,
                )}
                onClick={() => setTemperature(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tagi</Label>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_LEAD_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notatki</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Szybkie notatki z rozmowy..."
          />
        </div>

        <div className="flex flex-col gap-2 pt-2 pb-2">
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            className="min-h-11"
          >
            Zapisz
          </Button>
          {lead ? (
            <>
              <Button
                variant="secondary"
                onClick={handleLogCall}
                disabled={isPending}
                className="min-h-11"
              >
                Odnotuj call
              </Button>
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="size-4" />
                Usuń kontakt
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </SheetContent>
  );
}
