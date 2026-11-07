import ReactMarkdown from 'react-markdown'

// Raw HTML in descriptions is ignored by react-markdown, so authors cannot inject scripts.
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">{children}</a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
