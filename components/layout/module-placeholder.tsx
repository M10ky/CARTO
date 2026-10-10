import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { PageHeader } from "@/components/layout/page-header";

export function ModulePlaceholder({
  module,
  title,
  description,
  phase,
  planned,
}: {
  module: string;
  title: string;
  description: string;
  phase: string;
  planned: string[];
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        badge={
          <Badge tone="accent" dot>
            Module {module}
          </Badge>
        }
      />

      <Alert tone="info" title="Module en préparation">
        Écran provisoire. Aucune donnée n&apos;est affichée : les indicateurs et
        listes proviendront exclusivement de la base Supabase, jamais de valeurs
        de démonstration.
      </Alert>

      <Panel className="mt-4">
        <PanelHeader
          title="Prévu dans ce module"
          description={`Développement à partir de la ${phase}`}
        />
        <PanelBody>
          <ul className="flex flex-col gap-2">
            {planned.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-text-dim"
              >
                <span
                  aria-hidden
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-text-faint"
                />
                {item}
              </li>
            ))}
          </ul>
        </PanelBody>
      </Panel>
    </>
  );
}
