import { redirect } from "next/navigation";

export default function DashboardRedirect() {
  redirect("/gridframe/users/example-user/dashboards");
}
