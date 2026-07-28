"use client";

import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./EditorToolbar.module.scss";

interface EditorToolbarProps {
  name: string;
  editing: boolean;
  onNameChange: (name: string) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onConfig: () => void;
}

// The editor's page-level toolbar: a back breadcrumb, the editable batch name,
// and the Config action. Distinct from the site Header (chrome); persistence is
// automatic, so there's no Save/Done here.
export function EditorToolbar({
  name,
  editing,
  onNameChange,
  onStartEdit,
  onEndEdit,
  onConfig,
}: EditorToolbarProps) {
  return (
    <div className={styles.toolbar}>
      {/* Batches currently live on the homepage; becomes /batches in #120. */}
      <Link href="/#batches" className={styles.crumb}>
        <ChevronLeft size={14} strokeWidth={2.5} />
        My Batches
      </Link>
      <div className={styles.row}>
        {editing ? (
          <input
            autoFocus
            className={styles.nameInput}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onEndEdit}
            onKeyDown={(e) => e.key === "Enter" && onEndEdit()}
          />
        ) : (
          <h1 className={styles.name} onClick={onStartEdit} title="Click to rename">
            {name}
          </h1>
        )}
        <div className={styles.actions}>
          <Button hierarchy="secondary" size="sm" icon={<Settings size={15} />} onClick={onConfig}>
            Config
          </Button>
        </div>
      </div>
    </div>
  );
}
