import { HomeView } from "@/views/home";
import { homeContent } from "@/data/mocks/home";

export default function Home() {
  return <HomeView content={homeContent} />;
}
