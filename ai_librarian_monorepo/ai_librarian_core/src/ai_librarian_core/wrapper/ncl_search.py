import urllib.parse

from playwright.async_api import (
    BrowserContext as AsyncBrowserContext,
)
from playwright.async_api import (
    Page as AsyncPage,
)
from playwright.async_api import (
    TimeoutError as AsyncTimeoutError,
)
from playwright.async_api import (
    async_playwright,
)
from playwright.sync_api import BrowserContext, Page, TimeoutError, sync_playwright
from pydantic import BaseModel, Field

NCL_ENTRY_URL = "https://aleweb.ncl.edu.tw/F"


class NCLCrawlerError(Exception):
    pass


class NCLCrawlerCookieTimeoutError(NCLCrawlerError):
    pass


class NCLCrawlerSessionIdNotFoundError(NCLCrawlerError):
    pass


class NCLCrawlerSearchTimeoutError(NCLCrawlerError):
    pass


class NCLCrawlerSearchNoResultsError(NCLCrawlerError):
    pass


class BaseNCLSearch(BaseModel):
    """Base class for NCL search tools, containing shared configurations and utilities.

    Attributes:
        top_k_results (int): The maximum number of search results to retrieve (default: 10, min: 1, max: 20).
        cookie_timeout (int): The timeout in milliseconds for retrieving the session cookie (default: 10000).
        search_timeout (int): The timeout in milliseconds for waiting for search results (default: 15000).
    """

    top_k_results: int = Field(default=10, ge=1, le=20)
    cookie_timeout: int = Field(default=10000)
    search_timeout: int = Field(default=15000)

    def _encode_query(self, query: str) -> str:
        return urllib.parse.quote(query)


class NCLSearch(BaseNCLSearch):
    """A synchronous search tool for the National Central Library (NCL) catalog."""

    def _process_workflow(self, query: str) -> list[dict[str, str]]:
        with sync_playwright() as p:
            # TODO(youkwan): Find a better way to fetch cookies other than Playwright.
            # Playwright relies on too many dependencies which is too heavy for this use case.
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            page.route(
                "**/*",
                lambda route: (
                    route.abort()
                    if route.request.resource_type in ["image", "stylesheet", "font", "media"]
                    or "google-analytics.com" in route.request.url
                    else route.continue_()
                ),
            )
            session_id = self._get_session_id(context, page)
            results = self._search_ncl_results(query, session_id, page)
            return results

    def _get_session_id(self, context: BrowserContext, page: Page) -> str:
        page.goto(NCL_ENTRY_URL)
        try:
            page.wait_for_function("() => document.cookie.includes('ALEPH_SESSION_ID')", timeout=self.cookie_timeout)
        except TimeoutError as e:
            raise NCLCrawlerCookieTimeoutError(
                f"Timeout while getting cookie, exceeded cookie_timeout parameter({self.cookie_timeout}ms). "
                f"Please try increasing the cookie_timeout parameter."
            ) from e

        all_cookies = context.cookies()

        for cookie in all_cookies:
            if cookie["name"] == "ALEPH_SESSION_ID":
                return cookie["value"]
        raise NCLCrawlerSessionIdNotFoundError(
            f"Could not find session ID in {NCL_ENTRY_URL} cookies. Please try again."
        )

    def _search_ncl_results(self, query: str, session_id: str, page: Page) -> list[dict[str, str]]:
        encoded_query = self._encode_query(query)

        try:
            page.goto(
                f"{NCL_ENTRY_URL}/{session_id}?func=find-b&request={encoded_query}&find_code=WTI&adjacent=Y&local_base=&x=0&y=0&filter_code_1=WLN&filter_request_1=&filter_code_2=WYR&filter_request_2=&filter_code_3=WYR&filter_request_3=&filter_code_4=WMY&filter_request_4=&filter_code_5=WSL&filter_request_5="
            )
            page.wait_for_selector('tr[valign="baseline"] td:nth-child(3) a.brieftit', timeout=self.search_timeout)
        except TimeoutError as e:
            raise NCLCrawlerSearchTimeoutError(
                f"Timeout while searching for results, exceeded search_timeout parameter({self.search_timeout}ms). "
                f"Please try increasing the search_timeout parameter."
            ) from e

        result_rows_locator = page.locator('tr[valign="baseline"]')
        num_rows = result_rows_locator.count()
        if num_rows <= 0:
            raise NCLCrawlerSearchNoResultsError(
                f"No results found for query: {query}. Please try again with a different query."
            )

        results = []
        count = 0

        for i in range(num_rows):
            row_locator = result_rows_locator.nth(i)
            title_link_locator = row_locator.locator("td:nth-child(3) a.brieftit")

            book_title = None
            book_link = None

            if title_link_locator.count() > 0:
                book_title = title_link_locator.text_content()
                book_link = title_link_locator.get_attribute("href")

            author_locator = row_locator.locator("td:nth-child(4)")
            author = author_locator.text_content()

            if book_title:
                book_title = book_title.strip()
            if book_link:
                if not book_link.startswith("http"):
                    book_link = page.url.split("/F/")[0] + book_link
                book_link = book_link.strip()
            if author:
                author = author.strip()

            if book_title and book_link:
                results.append({"title": book_title, "author": author, "link": book_link})
                count += 1
                if count >= self.top_k_results:
                    break
        return results

    def run(self, query: str) -> str:
        results = self._process_workflow(query)
        return "\n".join(
            [f"{i + 1}. {result['title']} ({result['author']}) - {result['link']}" for i, result in enumerate(results)]
        )


class AsyncNCLSearch(BaseNCLSearch):
    """An asynchronous search tool for the National Central Library (NCL) catalog."""

    async def arun(self, query: str) -> str:
        results = await self._aprocess_workflow(query)
        return "\n".join(
            [f"{i + 1}. {result['title']} ({result['author']}) - {result['link']}" for i, result in enumerate(results)]
        )

    async def _aprocess_workflow(self, query: str) -> list[dict[str, str]]:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            await page.route(
                "**/*",
                lambda route: (
                    route.abort()
                    if route.request.resource_type in ["image", "stylesheet", "font", "media"]
                    or "google-analytics.com" in route.request.url
                    else route.continue_()
                ),
            )
            try:
                session_id = await self._aget_session_id(context, page)
                results = await self._asearch_ncl_results(query, session_id, page)
                return results
            finally:
                await browser.close()

    async def _aget_session_id(self, context: AsyncBrowserContext, page: AsyncPage) -> str:
        await page.goto(NCL_ENTRY_URL)
        try:
            await page.wait_for_function(
                "() => document.cookie.includes('ALEPH_SESSION_ID')", timeout=self.cookie_timeout
            )
        except AsyncTimeoutError as e:
            raise NCLCrawlerCookieTimeoutError(
                f"Timeout while getting cookie, exceeded cookie_timeout parameter({self.cookie_timeout}ms). "
                f"Please try increasing the cookie_timeout parameter."
            ) from e

        all_cookies = await context.cookies()

        for cookie in all_cookies:
            if cookie["name"] == "ALEPH_SESSION_ID":
                return cookie["value"]
        raise NCLCrawlerSessionIdNotFoundError(
            f"Could not find session ID in {NCL_ENTRY_URL} cookies. Please try again."
        )

    async def _asearch_ncl_results(self, query: str, session_id: str, page: AsyncPage) -> list[dict[str, str]]:
        encoded_query = self._encode_query(query)

        try:
            await page.goto(
                f"{NCL_ENTRY_URL}/{session_id}?func=find-b&request={encoded_query}&find_code=WTI&adjacent=Y&local_base=&x=0&y=0&filter_code_1=WLN&filter_request_1=&filter_code_2=WYR&filter_request_2=&filter_code_3=WYR&filter_request_3=&filter_code_4=WMY&filter_request_4=&filter_code_5=WSL&filter_request_5="
            )
            await page.wait_for_selector(
                'tr[valign="baseline"] td:nth-child(3) a.brieftit', timeout=self.search_timeout
            )
        except AsyncTimeoutError as e:
            raise NCLCrawlerSearchTimeoutError(
                f"Timeout while searching for results, exceeded search_timeout parameter({self.search_timeout}ms). "
                f"Please try increasing the search_timeout parameter."
            ) from e

        result_rows_locator = page.locator('tr[valign="baseline"]')
        num_rows = await result_rows_locator.count()
        if num_rows <= 0:
            raise NCLCrawlerSearchNoResultsError(
                f"No results found for query: {query}. Please try again with a different query."
            )

        results = []
        count = 0

        for i in range(num_rows):
            row_locator = result_rows_locator.nth(i)
            title_link_locator = row_locator.locator("td:nth-child(3) a.brieftit")

            book_title = None
            book_link = None

            if await title_link_locator.count() > 0:
                book_title = await title_link_locator.text_content()
                book_link = await title_link_locator.get_attribute("href")

            author_locator = row_locator.locator("td:nth-child(4)")
            author = await author_locator.text_content()

            if book_title:
                book_title = book_title.strip()
            if book_link:
                if not book_link.startswith("http"):
                    book_link = page.url.split("/F/")[0] + book_link
                book_link = book_link.strip()
            if author:
                author = author.strip()

            if book_title and book_link:
                results.append({"title": book_title, "author": author, "link": book_link})
                count += 1
                if count >= self.top_k_results:
                    break
        return results
