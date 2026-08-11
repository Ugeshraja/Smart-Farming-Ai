import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: "UGESHRAJA S",
    email: "ugeshraja@example.com",
    location: "Dharmapuri, Tamil Nadu",
    farmArea: "3.5 Acres",
    primaryCrops: ["Tomato", "Potato", "Brinjal"]
  });

  const logout = () => {
    alert("Logged out successfully.");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
