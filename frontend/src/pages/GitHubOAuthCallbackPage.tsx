import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";

export function GitHubOAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [message, setMessage] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      console.log("=== GITHUB OAUTH CALLBACK ===");
      console.log("Code:", code);
      console.log("Error:", error);

      if (error) {
        setStatus("error");
        setMessage(`GitHub OAuth error: ${error}`);
        return;
      }

      if (!code) {
        // Sem código - verificar se já está conectado
        try {
          const statusResponse = await api.get("/integrations/github/status");
          if (statusResponse.data.connected) {
            setStatus("success");
            setMessage("GitHub is already connected!");
            setTimeout(() => navigate("/integrations"), 2000);
            return;
          }
        } catch (e) {
          // Ignorar
        }

        setStatus("error");
        setMessage("No authorization code found");
        return;
      }

      try {
        console.log("Sending code to backend...");
        const response = await api.post("/integrations/github/oauth-callback", {
          code,
        });
        console.log("GitHub connection response:", response.data);

        setUserInfo(response.data);
        setStatus("success");
        setMessage("GitHub connected successfully!");

        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate("/integrations");
        }, 2000);
      } catch (error: any) {
        console.error("Error connecting GitHub:", error);

        // Verificar se o erro é porque já está conectado
        try {
          const statusResponse = await api.get("/integrations/github/status");
          if (statusResponse.data.connected) {
            console.log("GitHub is already connected despite error");
            setStatus("success");
            setMessage("GitHub connected successfully!");
            setTimeout(() => navigate("/integrations"), 2000);
            return;
          }
        } catch (statusError) {
          // Ignorar
        }

        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Error connecting GitHub. Please try again.",
        );
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
      <div className="text-center p-8 max-w-md">
        {status === "processing" && (
          <>
            <div className="font-mono text-3xl text-terminal-accent animate-pulse mb-4">
              ⏳
            </div>
            <div className="font-mono text-terminal-text text-lg">
              &lt;connecting_to_github/&gt;
            </div>
            <div className="font-mono text-terminal-dim text-sm mt-2">
              Please wait...
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="font-mono text-3xl mb-4">✅</div>
            {userInfo?.avatarUrl && (
              <img
                src={userInfo.avatarUrl}
                alt={userInfo.login}
                className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-terminal-accent"
              />
            )}
            <div className="font-mono text-terminal-accent text-lg">
              {userInfo?.login ? `@${userInfo.login}` : "GitHub"}
            </div>
            <div className="font-mono text-terminal-text mt-2">{message}</div>
            <div className="font-mono text-terminal-dim text-sm mt-2">
              Redirecting to integrations...
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="font-mono text-3xl text-red-500 mb-4">❌</div>
            <div className="font-mono text-red-500 text-sm">{message}</div>
            <div className="flex gap-2 justify-center mt-6">
              <button
                onClick={() => navigate("/integrations")}
                className="px-4 py-2 bg-terminal-surface border border-terminal-accent text-terminal-accent font-mono text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
              >
                [ Back to Integrations ]
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
