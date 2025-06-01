import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Novo tratamento de erro: tenta extrair mensagem JSON, depois texto, depois HTML
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    let errorMsg = `${res.status}: Erro desconhecido`;
    try {
      if (contentType.includes("application/json")) {
        const json = await res.json();
        errorMsg = json.message || JSON.stringify(json);
      } else if (contentType.includes("text/plain")) {
        errorMsg = await res.text();
      } else if (contentType.includes("text/html")) {
        const text = await res.text();
        if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
          errorMsg = "Resposta inesperada do servidor (HTML). Verifique se o backend está rodando e se o endpoint existe.";
        } else {
          errorMsg = text;
        }
      }
    } catch (e) {
      // fallback
    }
    throw new Error(errorMsg);
  }

  // Detecta resposta HTML inesperada (mesmo com status 200)
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    const text = await res.text();
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      throw new Error("Resposta inesperada do servidor (HTML). Verifique se o backend está rodando e se o endpoint existe.");
    }
  }

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
