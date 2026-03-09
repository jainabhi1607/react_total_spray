import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Cards",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
