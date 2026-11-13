// useSaveTags: saves a registered project's tags to projects.json, with the saving state and Rust's error.

import { useState } from "react";
import { setTags } from "../../lib/backend";

/** `save` resolves true when the tags were written; then `onSaved` rescans. */
export function useSaveTags(root: string, path: string, onSaved: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (tags: string[]) => {
    setSaving(true);
    setError(null);
    try {
      await setTags(root, path, tags);
      onSaved();
      return true;
    } catch (reason) {
      setError(String(reason));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { save, saving, error };
}
