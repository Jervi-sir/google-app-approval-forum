import Image from "next/image";
import PostsPage from "./posts/page";
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/posts")
}
