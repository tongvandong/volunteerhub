import api from "../httpClient";

export const certificateApi = {
  getMyCertificates: () => api.get("/certificates"),
  verify: (code) => api.get(`/certificates/${code}`),
  getPdfUrl: (code) => `/api/certificates/${encodeURIComponent(code)}/pdf`,
};

export const uploadApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/uploads/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/uploads/file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
