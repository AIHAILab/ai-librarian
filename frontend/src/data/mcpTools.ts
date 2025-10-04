// src/data/mcpTools.ts
export type ToolArg = {
  arg: string;
  type: string;
  description: string;
  required: boolean;
};

export type Tool = {
  name: string;
  description: string; // 英文原文（保留備用）
  args_schema: ToolArg[];
};

export const mcpTools: Tool[] = [
  {
    name: "date_time",
    description: "A tool that returns the current date and time in ISO 8601 format.",
    args_schema: []
  },
  {
    name: "arxiv",
    description:
      "A wrapper around Arxiv.org Useful for when you need to answer questions about Physics, Mathematics, Computer Science, Quantitative Biology, Quantitative Finance, Statistics, Electrical Engineering, and Economics from scientific articles on arxiv.org. Input should be a search query.",
    args_schema: [
      { arg: "query", type: "string", description: "search query to look up", required: true }
    ]
  },
  {
    name: "duckduckgo_results_json",
    description:
      "A wrapper around Duck Duck Go Search. Useful for when you need to answer questions about current events. Input should be a search query.",
    args_schema: [
      { arg: "query", type: "string", description: "search query to look up", required: true }
    ]
  },
  {
    name: "youtube_search",
    description:
      "search for youtube videos associated with a person. the input to this tool should be a comma separated list, the first part contains a person name and the second a number that is the maximum number of video results to return aka num_results. the second part is optional",
    args_schema: [
      { arg: "query", type: "string", description: "The query to search for on YouTube.", required: true }
    ]
  },
  {
    name: "ncl_search",
    description:
      "A tool for searching the Taiwan National Central Library(NCL, 國家圖書館) catalog.The search results are returned in a string, containing the title, author, and link of the book.The title and author are returned in the same language as the query, and the link is the URL of the book.",
    args_schema: [
      { arg: "query", type: "string", description: "The query to search the NCL catalog.", required: true }
    ]
  },
  {
    name: "wikipedia",
    description:
      "A wrapper around Wikipedia. Useful for when you need to answer general questions about people, places, companies, facts, historical events, or other subjects. Input should be a search query.",
    args_schema: [
      { arg: "query", type: "string", description: "query to look up on wikipedia", required: true }
    ]
  },
  {
    name: "google_search",
    description:
      "A wrapper around Google Search. Useful for when you need to answer questions about current events. Input should be a search query.",
    args_schema: [
      { arg: "query", type: "string", description: "The query to search for on Google.", required: true }
    ]
  },
  {
    name: "google_books",
    description:
      "A tool that searches the Google Books API. Useful for when you need to answer general inquiries about books of certain topics and generate recommendation based off of key wordsInput should be a query string",
    args_schema: [
      { arg: "query", type: "string", description: "query to look up on google books", required: true }
    ]
  },
  {
    name: "open_weather_map",
    description:
      "A wrapper around OpenWeatherMap API. Useful for fetching current weather information for a specified location. Input should be a location string (e.g. London,GB).",
    args_schema: [
      { arg: "location", type: "string", description: "The location to get the weather for.", required: true }
    ]
  }
];

// 中文描述對照（顯示用）
export const toolZhDesc: Record<string, string> = {
  date_time: "顯示地區的日期與時間。",
  arxiv:
    "用於查詢各領域，包括物理、數學、電腦科學、定量生物、定量金融、統計、電機工程、經濟學等相關的學術文章。",
  duckduckgo_results_json:
    "DuckDuckGo 適合查詢時事。",
  youtube_search:
    "搜尋與特定人物相關的 YouTube 影片。輸入為逗號分隔：第一段是人名，第二段是要回傳的最大筆數。",
  ncl_search:
    "國家圖書館（NCL）館藏查詢工具。回傳書名、作者與連結；語言會跟查詢一致。",
  wikipedia:
    "維基百科包裝器，適合查一般人物、地點、公司、事實、歷史事件等。",
  google_search:
    "Google 搜尋，適合查時事。",
  google_books:
    "Google Books 搜尋工具，可依主題找書並產生推薦。",
  open_weather_map:
    "OpenWeatherMap，可以取得指定地點的即時天氣。輸入方式為地點字串（如 London,GB）。"
};
