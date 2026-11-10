"use client";
import { useEffect, useState } from "react";
import { Check, RotateCcw, Save, TriangleAlert } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { CORNERS, DEFAULT_THEME, PRESETS, contrastReport } from "@/lib/theme";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Notice from "@/components/ui/Notice";
import Progress from "@/components/ui/Progress";
import Avatar from "@/components/ui/Avatar";
import PageHeader from "@/components/ui/PageHeader";
import { Field, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";

const HEX = /^#[0-9a-fA-F]{6}$/;
const same = (a, b) =>
  ["preset", "accent", "background", "text", "corners", "autoLight"].every(
    (k) => a[k] === b[k],
  );

/** Colour swatch + hex field. Typing only applies once the hex is complete. */
function ColorField({ label, value, onChange }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <Field label={label}>
      <div className="flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-900/80 p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} colour`}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (HEX.test(e.target.value))
              onChange(e.target.value.toLowerCase());
          }}
          onBlur={() => setText(value)}
          spellCheck={false}
          maxLength={7}
          aria-label={`${label} hex value`}
          className="min-w-0 flex-1 bg-transparent px-1 font-mono text-sm uppercase text-slate-100 focus:outline-none"
        />
      </div>
    </Field>
  );
}

function PresetTile({ preset, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "rounded-2xl border p-2 text-left transition",
        active
          ? "border-brand-400 shadow-glow"
          : "border-ink-600 hover:border-brand-500/60",
      )}
    >
      <div
        className="flex items-center gap-2 rounded-xl border px-3 py-3"
        style={{
          background: preset.background,
          borderColor: `${preset.text}22`,
        }}
      >
        <span
          className="h-3 w-3 rounded-full"
          style={{ background: preset.accent }}
        />
        <span
          className="h-1.5 flex-1 rounded-full"
          style={{ background: preset.text }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between px-1 text-sm font-semibold text-white">
        {preset.name}
        {active && <Check size={15} className="text-brand-400" />}
      </div>
    </button>
  );
}

export default function ThemePage() {
  const { can } = useAuth();
  const { saved, loaded, applyPreview, save } = useTheme();
  const toast = useToast();
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loaded && !draft) setDraft(saved);
  }, [loaded, saved, draft]);

  // Live preview across the whole site while editing; go back to the saved theme when leaving
  useEffect(() => {
    if (draft) applyPreview(draft);
  }, [draft, applyPreview]);
  useEffect(() => () => applyPreview(null), [applyPreview]);

  if (!can.canManageTheme)
    return (
      <EmptyState
        title="Not available for your role"
        message="Changing the site theme needs the Manage setup permission."
      />
    );
  if (!draft) return null;

  const dirty = !same(draft, saved);
  const checks = contrastReport(draft);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const pick = (p) =>
    set({
      preset: p.id,
      accent: p.accent,
      background: p.background,
      text: p.text,
    });
  const edit = (key) => (value) => set({ [key]: value, preset: "custom" });

  const doSave = async () => {
    setBusy(true);
    try {
      await save(draft);
      toast.success("Theme saved. Everyone now sees it.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const reset = () => {
    setDraft({ ...DEFAULT_THEME });
    toast.info(
      "Default theme shown as a preview. Press Save theme to apply it for everyone.",
    );
  };

  return (
    <div>
      <PageHeader
        title="Theme & colours"
        subtitle="Pick a preset or fine-tune three colours. Surfaces, borders and text shades are generated for you. Changes preview live across the whole site; saving applies the theme for everyone."
        actions={
          <>
            <Button onClick={reset}>
              <RotateCcw size={15} /> Reset to default
            </Button>
            <Button
              variant="primary"
              onClick={doSave}
              loading={busy}
              disabled={!dirty}
            >
              <Save size={15} /> Save theme{dirty ? " •" : ""}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader
            title="Presets"
            subtitle="Dark and light looks. Daylight and Paper are light themes."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {PRESETS.map((p) => (
              <PresetTile
                key={p.id}
                preset={p}
                active={draft.preset === p.id}
                onClick={() => pick(p)}
              />
            ))}
            <button
              type="button"
              onClick={() => set({ preset: "custom" })}
              aria-pressed={draft.preset === "custom"}
              className={clsx(
                "rounded-2xl border p-2 text-left transition",
                draft.preset === "custom"
                  ? "border-brand-400 shadow-glow"
                  : "border-ink-600 hover:border-brand-500/60",
              )}
            >
              <div
                className="h-[52px] rounded-xl border border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${draft.background}, ${draft.accent})`,
                }}
              />
              <div className="mt-2 flex items-center justify-between px-1 text-sm font-semibold text-white">
                Custom{" "}
                {draft.preset === "custom" && (
                  <Check size={15} className="text-brand-400" />
                )}
              </div>
            </button>
          </div>

          <div className="mt-7">
            <h3 className="text-sm font-semibold text-white">Custom colours</h3>
            <p className="mt-1 text-xs text-slate-400">
              Editing any colour switches to Custom.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ColorField
                label="Accent"
                value={draft.accent}
                onChange={edit("accent")}
              />
              <ColorField
                label="Background"
                value={draft.background}
                onChange={edit("background")}
              />
              <ColorField
                label="Text"
                value={draft.text}
                onChange={edit("text")}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Corners">
                <Select
                  value={draft.corners}
                  onChange={(e) => set({ corners: e.target.value })}
                >
                  {Object.entries(CORNERS).map(([k, c]) => (
                    <option key={k} value={k}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Device setting">
                <label className="flex h-[42px] cursor-pointer items-center gap-2.5 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={draft.autoLight}
                    onChange={(e) => set({ autoLight: e.target.checked })}
                    className="h-4 w-4 accent-brand-500"
                  />
                  Switch to Daylight on devices set to light mode
                </label>
              </Field>
            </div>

            <div
              className="mt-4 flex flex-wrap gap-2"
              aria-label="Contrast checks"
            >
              {checks.map((c) => {
                const ok = c.ratio >= c.min;
                return (
                  <Badge key={c.label} tone={ok ? "green" : "amber"}>
                    {ok ? <Check size={12} /> : <TriangleAlert size={12} />}{" "}
                    {c.label} {c.ratio.toFixed(1)}:1
                  </Badge>
                );
              })}
            </div>
            {checks.some((c) => c.ratio < c.min) && (
              <p className="mt-3 text-xs text-amber-300">
                Some text may be hard to read with these colours. You can still
                save, but aim for the minimum ratios (4.5:1 for text, 3:1 for
                the accent).
              </p>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Saved to the server and shown to everyone, whatever their role.
              The gold top-performer card keeps its own gold and navy look on
              every theme.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Live preview"
            subtitle="Real components using the colours on the left"
            action={<Badge tone="blue">Preview</Badge>}
          />
          <div className="rounded-2xl border border-ink-600 bg-ink-950/60 p-4">
            <div className="flex items-start justify-between">
              <div className="text-xs font-medium text-slate-400">
                Today&apos;s sales
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
                ৳
              </span>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-white">
              ৳ 184,500
            </div>
            <div className="mt-1.5 text-xs font-semibold text-emerald-400">
              ▲ 12% vs target
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="primary">Primary action</Button>
            <Button>Secondary</Button>
            <Badge tone="green">Achieved</Badge>
            <Badge tone="amber">Pending</Badge>
            <Badge tone="blue">Info</Badge>
          </div>

          <div className="mt-5 grid grid-cols-[84px_1fr_40px] items-center gap-3 text-xs">
            <span className="text-slate-300">Panthapath</span>
            <Progress value={72} tone="blue" height={8} />
            <span className="text-right font-bold text-white">72%</span>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-ink-600/60">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Employee</th>
                  <th className="th">Sales</th>
                </tr>
              </thead>
              <tbody>
                <tr className="tr-hover">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name="Ayesha Rahman" size={32} />
                      <span className="font-semibold text-white">
                        Employee name
                      </span>
                    </div>
                  </td>
                  <td className="td">৳ 12,500</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Notice tone="amber" className="!mb-0 mt-5">
            Notice banners adapt too.
          </Notice>
        </Card>
      </div>
    </div>
  );
}
