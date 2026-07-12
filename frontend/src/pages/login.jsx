import { useNavigate } from "react-router-dom";

import { LoginForm } from "@/components/login-form";

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/dashboard");
  };

  return <LoginForm onSubmit={handleSubmit} />;
}
