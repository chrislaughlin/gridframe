import { redirect } from "next/navigation";

function Home() {
  redirect("/gridframe/users/example-user/dashboards");
}

export default Home;
