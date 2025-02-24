import React from "react";

interface Article {
  article_id: string;
  title: string;
  link: string;
  keywords?: string[];
  creator?: string[];
  description?: string;
  pubDate: string;
  image_url?: string;
  source_name: string;
  source_url: string;
}

const NewsCard: React.FC<{ article: Article }> = ({ article }) => {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row gap-4 hover:bg-gray-800 transition-all">
      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full sm:w-40 h-40 object-cover rounded-lg"
        />
      )}

      <div className="flex flex-col justify-between">
        <h2 className="text-lg font-bold">{article.title}</h2>
        <p className="text-gray-400 text-sm">{article.description}</p>
        <div className="flex items-center justify-between mt-2 text-gray-500 text-xs">
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            Read more
          </a>
          <span>{new Date(article.pubDate).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const NewsList: React.FC<{ articles: Article[] }> = ({ articles }) => {
  return (
    <div className="bg-black min-h-screen p-6">
      <h1 className="text-2xl text-white font-bold mb-4">Latest Solana News</h1>
      <div className="grid gap-6">
        {articles.map((article) => (
          <NewsCard key={article.article_id} article={article} />
        ))}
      </div>
    </div>
  );
};

export default NewsList;
