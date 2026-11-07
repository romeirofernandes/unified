import { useCallback, useEffect, useState } from "react";
import { cacheResource, prefetchResource, readResource } from "@/lib/resource-cache";

// Keep recently loaded content on navigation and during background refreshes.
export function useApiResource(path, uid) {
  const [resource, setResource] = useState(() => ({ path, uid, data: readResource(path, uid)?.data ?? null, error: "" }));
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!uid) return;
    let current = true;
    prefetchResource(path, uid, revision > 0).then(
      (data) => { if (current) setResource({ path, uid, data, error: "" }); },
      (error) => { if (current) setResource({ path, uid, data: readResource(path, uid)?.data ?? null, error: error.message }); },
    );
    return () => { current = false; };
  }, [path, uid, revision]);
  const current = resource.path === path && resource.uid === uid;
  const data = current ? resource.data : readResource(path, uid)?.data ?? null;
  const error = current ? resource.error : "";
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  return {
    data, error, loading: data === null && !error,
    refresh, reload: refresh,
    setData: (update) => {
      const previous = readResource(path, uid)?.data ?? data;
      const next = typeof update === "function" ? update(previous) : update;
      cacheResource(path, uid, next);
      setResource({ path, uid, data: next, error: "" });
    },
  };
}
