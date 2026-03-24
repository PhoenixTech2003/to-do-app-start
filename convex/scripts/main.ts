function dedent(text: string) {
  const lines = text.replace(/^\n/, '').split('\n')
  const indentation = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^ */)?.[0].length ?? 0)
  const minIndent = Math.min(...indentation)

  return lines.map((line) => line.slice(minIndent)).join('\n').trim()
}

function buildMalawi24ArchiveUrl(year: number, month: number, day: number) {
  const formattedMonth = String(month).padStart(2, '0')
  const formattedDay = String(day)
  return `https://malawi24.com/${year}/${formattedMonth}/${formattedDay}/`
}

export const scrapeMalawi24ArticlesScript = ({
  year,
  month,
  day,
}: {
  year: number
  month: number
  day: number
}) => {
  const startUrl = buildMalawi24ArchiveUrl(year, month, day)

  return dedent(`
    import json
    import sys
    import pysqlite3

    sys.modules["sqlite3"] = pysqlite3

    from scrapling.fetchers import AsyncStealthySession
    from scrapling.spiders import Response, SessionManager, Spider

    class Malawi24Spider(Spider):
        name = "malawi24_articles"
        start_urls = ["${startUrl}"]
        allowed_domains = {"malawi24.com"}
        concurrent_requests = 4
        concurrent_requests_per_domain = 2
        download_delay = 0.2

        def configure_sessions(self, manager: SessionManager) -> None:
            manager.add(
                "stealth",
                AsyncStealthySession(
                    headless=True,
                    disable_resources=True,
                    network_idle=False,
                    timeout=30000,
                    wait=500,
                    locale="en-US",
                    timezone_id="Africa/Blantyre",
                    user_data_dir="./browser-profile",
                    solve_cloudflare=True,
                    block_webrtc=True,
                    hide_canvas=True,
                    allow_webgl=True,
                    extra_headers={
                        "Accept-Language": "en-US,en;q=0.9",
                    },
                    selector_config={
                        "adaptive": True,
                    },
                ),
                default=True,
            )

        async def parse(self, response: Response):
            items = response.css("li.col-xs-12.col-sm-12.col-md-12.col-lg-12.col-xs-vertical")
            pagination_links = {
                href
                for href in response.css("ul.page-numbers a.page-numbers::attr(href)").getall()
                if href
            }

            for item in items:
                link = item.css("a::attr(href)").get()
                if not link:
                    continue

                title = item.css("a::attr(title)").get() or item.css("a::text").get("")
                title = title.strip()
                if not title:
                    continue

                yield response.follow(
                    link,
                    callback=self.parse_article,
                    meta={"title": title},
                )

            for page_link in pagination_links:
                yield response.follow(page_link, callback=self.parse, priority=-1)

        async def parse_article(self, response: Response):
            paragraphs = [
                paragraph.strip()
                for paragraph in response.css("div.wsw > p::text").getall()
                if paragraph and paragraph.strip()
            ]

            yield {
                "title": response.meta.get("title", "").strip(),
                "headline_image": response.css("div.cover-media img::attr(src)").get(""),
                "author": response.css("li.links-item a.links-item-link::text").get("").strip(),
                "content": "\\n\\n".join(paragraphs),
                "url": response.url,
            }

    if __name__ == "__main__":
        result = Malawi24Spider().start()
        items = list(result.items)
        print(
            json.dumps(
                {
                    "source": "malawi24",
                    "count": len(items),
                    "articles": items,
                },
                ensure_ascii=False,
            )
        )
  `)
}
