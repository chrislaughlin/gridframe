import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { examples, getExample } from "../../data/examples";
import { ExampleClient } from "./example-client";

export function generateStaticParams() {
  return examples.map((example) => ({ slug: example.slug }));
}

type ExamplePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ExamplePageProps): Promise<Metadata> {
  const { slug } = await params;
  const example = getExample(slug);
  if (!example) return {};
  return {
    title: `${example.title} example | Gridframe`,
    description: example.description,
  };
}

async function ExamplePage({ params }: ExamplePageProps) {
  const { slug } = await params;
  const example = getExample(slug);
  if (!example) notFound();

  return <ExampleClient example={example} />;
}

export default ExamplePage;
