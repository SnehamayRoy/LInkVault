export const getToken = () => localStorage.getItem("linkvault_token");

export const setToken = (token) => {
  localStorage.setItem("linkvault_token", token);
};

export const clearToken = () => {
  localStorage.removeItem("linkvault_token");
};
