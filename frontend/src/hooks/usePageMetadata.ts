 import { useEffect } from "react";

interface PageMetadataOptions {
  title: string;
  description: string;
  keywords?: string[] | string;
  faviconHref?: string;
}

export const usePageMetadata = ({
  title,
  description,
  keywords,
  faviconHref = "/vite.svg",
}: PageMetadataOptions) => {
  useEffect(() => {
    document.title = title;

    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.setAttribute("name", "description");
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute("content", description);

    if (keywords) {
      const keywordValue = Array.isArray(keywords)
        ? keywords.join(", ")
        : keywords;
      let keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (!keywordsMeta) {
        keywordsMeta = document.createElement("meta");
        keywordsMeta.setAttribute("name", "keywords");
        document.head.appendChild(keywordsMeta);
      }
      keywordsMeta.setAttribute("content", keywordValue);
    }

    let faviconLink = document.querySelector("link[rel='icon']");
    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.setAttribute("rel", "icon");
      document.head.appendChild(faviconLink);
    }
    faviconLink.setAttribute("href", faviconHref);
  }, [title, description, keywords, faviconHref]);
};
