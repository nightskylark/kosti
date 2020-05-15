const thymeleaf = require("/lib/thymeleaf");
const portal = require("/lib/xp/portal");
const contentLib = require("/lib/xp/content");
const httpClientLib = require("/lib/http-client");
const cacheLib = require("/lib/cache");

const libLocation = "../../lib/";
const norseUtils = require(libLocation + "norseUtils");
const helpers = require(libLocation + "helpers");
const userLib = require(libLocation + "userLib");
const blogLib = require(libLocation + "blogLib");
const sharedLib = require(libLocation + "sharedLib");
const storeLib = require(libLocation + "storeLib");
const hashtagLib = require(libLocation + "hashtagLib");

const cache = cacheLib.newCache({
  size: 1000,
  expire: 60 * 60 * 24
});

exports.get = handleReq;

function handleReq(req) {
  let user = userLib.getCurrentUser();

  function renderView() {
    let view = resolve("homePage.html");
    let model = createModel();
    let body = thymeleaf.render(view, model);
    let fileName = portal.assetUrl({ path: "js/homepage.js" });
    return {
      body: body,
      contentType: "text/html",
      pageContributions: {
        bodyEnd: ["<script src='" + fileName + "'></script>"]
      }
    };
  }

  function createModel() {
    let content = portal.getContent();
    let site = portal.getSiteConfig();
    let schedule = getSchedule();
    let video = getVideo(app.config.gApiKey);
    let active = {};
    switch (req.params.feed) {
      case "new":
        active.new = "active";
        break;
      case "podcasts":
        active.podcasts = "active";
        break;
      case "bookmarks":
        active.bookmarks = "active";
        break;
      default:
        active.hot = "active";
        break;
    }

    let model = {
      content: content,
      video: video
        ? "https://www.youtube.com/embed/" + video
        : getVideoUrl(site.video),
      sidebar: blogLib.getSidebar({ cache: cache }),
      schedule: schedule,
      active: active,
      hotDate: new Date().toISOString(),
      loadMoreComponent: helpers.getLoadMore(),
      pageComponents: helpers.getPageComponents(req, "footerBlog"),
      slider: getSlider(site.slider)
    };

    return model;

    function getSchedule() {
      return cache.get("schedule", function () {
        let scheduleLocation = contentLib.get({ key: site.scheduleLocation });
        let now = new Date();
        now.setDate(now.getDate() - 1);
        now = now.toISOString();
        let result = contentLib.query({
          query: "data.date > dateTime('" + now + "')",
          start: 0,
          count: 3,
          sort: "data.date ASC",
          contentTypes: [app.name + ":schedule"]
        }).hits;
        for (let i = 0; i < result.length; i++) {
          result[i] = beautifySchedule(result[i]);
        }
        let resCopy = JSON.parse(JSON.stringify(result));
        while (result.length < 3) {
          for (let i = 0; i < resCopy.length; i++) {
            if (result.length >= 3) {
              break;
            }
            if (resCopy[i].data.repeat) {
              let temp = JSON.parse(JSON.stringify(resCopy[i]));
              let itemDate = new Date(temp.data.date);
              itemDate.setDate(
                itemDate.getDate() + 7 * parseInt(temp.data.repeat)
              );
              temp.data.date = itemDate;
              result.push(beautifySchedule(temp));
            }
          }
        }
        return result;
      });
    }

    function beautifySchedule(item) {
      item.image = norseUtils.getImage(item.data.image, "block(301, 109)");
      let itemDate = new Date(item.data.date);
      item.month = norseUtils.getMonthName(itemDate);
      item.day = itemDate.getDate().toFixed();
      item.hashtags = hashtagLib.getHashtags(item.data.hashtags);
      item.time = norseUtils.getTime(itemDate);
      if (item.repeat) {
        repeatedItems = true;
      }
      return item;
    }

    function getSliderView(slider) {
      return thymeleaf.render(resolve("slider.html"), {
        slider: slider
      });
    }

    function getSlider(articles) {
      let result = [];
      articles = norseUtils.forceArray(articles);
      for (let i = 0; i < articles.length; i++) {
        let temp = contentLib.get({ key: articles[i] });
        result.push(blogLib.beautifyArticle(temp, cache));
      }
      return getSliderView(result);
    }

    function getVideo(key) {
      return cache.get("video", function () {
        let response = JSON.parse(
          httpClientLib.request({
            url:
              "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCETKVT-Uj-gAqdSTd2YNaMg&maxResults=1&order=date&type=video&key=" +
              key,
            method: "GET",
            headers: {
              "X-Custom-Header": "header-value"
            },
            contentType: "application/json"
          }).body
        );
        if (
          response.items &&
          response.items[0] &&
          response.items[0].id &&
          response.items[0].id.videoId
        ) {
          return response.items[0].id.videoId;
        }
        return false;
      });
    }

    function getVideoUrl(url) {
      url = url.split("/");
      url = url[url.length - 1];

      if (url.split("?v=")[1]) {
        return "https://www.youtube.com/embed/" + url.split("?v=")[1];
      } else {
        return "https://www.youtube.com/embed/" + url;
      }
    }
  }
  return renderView();
}
