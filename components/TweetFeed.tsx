"use client"
import { useEffect, useState } from "react";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  link: string;
  description?: string;
  image?: string;
  source: string;
  published: string;
}

export default function SolanaNews() {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/tweet");
        if (!response.ok) throw new Error("Failed to fetch news");

        const data = await response.json();
        const filteredNews = data.results.map((article: any) => ({
          id: article.article_id,
          title: article.title,
          link: article.link,
          description: article.description || "No description available",
          image: article.image_url,
          source: article.source_name,
          published: new Date(article.pubDate).toLocaleString(),
        }));

        setNews(filteredNews);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400 mt-6">Loading Solana news...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-6">Failed to fetch news. Please try again later.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Latest Solana News</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((article) => (
          <div key={article.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:bg-gray-700 transition-all">
            {article.image && (
              <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold">{article.title}</h2>
              <p className="text-gray-400 text-sm mt-2">{article.description}</p>
              <p className="text-gray-500 text-xs mt-2">Source: {article.source}</p>
              <p className="text-gray-500 text-xs">Published: {article.published}</p>
              <Link href={article.link} target="_blank" className="text-blue-400 mt-3 inline-block">
                Read More →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
