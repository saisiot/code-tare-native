import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function ReadmePage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReadme();
  }, []);

  async function fetchReadme() {
    try {
      const res = await fetch('/api/readme');
      const data = await res.json();

      if (data.success) {
        // 이미지 경로를 서버 경로로 변환
        const contentWithFixedImages = data.content.replace(
          /src="docs\/images\//g,
          'src="http://localhost:3001/docs/images/'
        );
        setContent(contentWithFixedImages);
      } else {
        setError('README를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('Error fetching README:', err);
      setError('README를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">📖 README 로드 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <article className="prose prose-lg prose-slate max-w-none
            prose-headings:font-bold
            prose-h1:text-4xl prose-h1:mb-4 prose-h1:text-blue-600
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:pb-2
            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-blue-600 prose-a:font-medium hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-bold
            prose-ul:my-4 prose-ul:list-none prose-ul:pl-0
            prose-li:text-gray-700 prose-li:mb-2 prose-li:pl-6 prose-li:relative
            prose-li:before:content-['▸'] prose-li:before:absolute prose-li:before:left-0 prose-li:before:text-blue-500 prose-li:before:font-bold
            prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
            prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
            prose-pre:shadow-inner
            prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
            prose-img:rounded-lg prose-img:shadow-lg prose-img:my-6
          ">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}
