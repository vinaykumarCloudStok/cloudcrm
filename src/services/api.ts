import axios from "axios";

const api = axios.create({
  baseURL: "https://agenticcrm-production.up.railway.app/api",
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("agentcrm_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("agentcrm_refresh");

      if (!refreshToken) {
        localStorage.removeItem("agentcrm_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          "https://agenticcrm-production.up.railway.app/api/auth/refresh",
          { refreshToken }
        );

        const newToken = res.data.accessToken;

        localStorage.setItem("agentcrm_token", newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("agentcrm_token");
        localStorage.removeItem("agentcrm_refresh");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;