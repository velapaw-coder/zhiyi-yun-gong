import ForbiddenView from "../forbidden";

export const metadata = { title: "无权访问" };

export default function AccessDeniedPage() {
  return <ForbiddenView />;
}
