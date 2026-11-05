import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

// Each request owns its result; route changes and unmounts abort stale work.
export function useApiResource(path, uid) {
  const [resource, setResource] = useState({
    path: null,
    uid: null,
    data: null,
    error: "",
    loading: true,
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!uid) return;
    const controller = new AbortController();
    apiRequest(path, { uid, signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted)
          setResource({ path, uid, data, error: "", loading: false });
      },
      (error) => {
        if (!controller.signal.aborted)
          setResource({
            path,
            uid,
            data: null,
            error: error.message,
            loading: false,
          });
      },
    );
    return () => controller.abort();
  }, [path, uid, revision]);

  const current = resource.path === path && resource.uid === uid;
  return {
    data: current ? resource.data : null,
    error: current ? resource.error : "",
    loading: !current || resource.loading,
    reload: () => {
      setResource((previous) => ({ ...previous, loading: true }));
      setRevision((value) => value + 1);
    },
    setData: (update) =>
      setResource((previous) => ({
        ...previous,
        data: typeof update === "function" ? update(previous.data) : update,
      })),
  };
}
