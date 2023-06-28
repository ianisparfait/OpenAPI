class OpenAPI{
  constructor(config) {
    this._config = config;

    this.wrapper = document.querySelector('.wrapper');
    this.wrapperSection = document.querySelector('.wrapper_sections');

    this.data = JSON.parse(this._config.data);

    this.pathRegex = /\/v1\/(.*)/;

    this.sections = [];
  }

  async init() {
    console.log(this.data);
    await this.setupInfos();
    this.makeContent();
    this.toggleSection();
  }

  // Setup
  async setupInfos() {
    const title = document.querySelector(".wrapper_header_title"),
    version = document.querySelector(".wrapper_header_version");

    if (title && version) {
      title.innerHTML = this.data["info"]["title"];
      version.innerHTML = `Version: ${this.data["info"]["version"]}`;
      this.setupPaths();
    }
  }
  setupPaths() {
    const paths = this.data["paths"];

    for (const key in paths) {
      if (Object.hasOwnProperty.call(paths, key)) {
        const value = paths[key];
        this.sections.push({
          title: this.pathRegex.exec(key)[1] !== "" ? this.pathRegex.exec(key)[1] : "Default",
          content: value,
        });
      }
    }
  }

  makeContent() {
    const Shtml = `
      <section class="section">
        <div class="section_header">
          <h2 class="section_header_title">__title__</h2>
          <i class='bx bx-chevron-down section_header_icon'></i>
        </div>
      </section>
    `;
    const Chtml = `
      <div class="section_content">
        <div class="section_content_item __method__">
          <div class="section_content_item_inner">
            <div class="section_content_item_header">
              <div class="left">
                <div class="method">__method__</div>
                <div class="url">__path__</div>
                <div class="description">__description__</div>
              </div>
              <div class="right">
                <i class='bx bx-chevron-down section_header_icon'></i>
              </div>
            </div>
            <div class="section_content_item_body">
              <div class="section_content_item_body_infos"></div>
              <div class="section_content_item_body_responses">
                <div class="header_inner_section">Responses</div>
                <div class="item_inner_responses">
                  <table class="item_inner_responses_table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Description</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody class="b">

                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      let sectionHTML = this.formatStringToHTML(Shtml, '__title__', section["title"]);
      this.wrapperSection.appendChild(sectionHTML);

      for (const key in section["content"]) {
        if (Object.hasOwnProperty.call(section["content"], key)) {
          const value = section["content"][key];
          if (!Array.isArray(value)) {
            let contentHTML = this.formatStringToHTMLAllReferences(Chtml, '__method__', key);
            contentHTML = this.formatStringToHTMLInArray(contentHTML, '__description__', value["Description"]);
            contentHTML = this.formatStringToHTML(contentHTML, '__path__', value["exact_route"]);
            sectionHTML.appendChild(contentHTML);

            const resValue = value["responses"];
            const tableBODY = contentHTML.querySelector("table .b");
            this.makeTableBody(resValue, tableBODY);
          } else {
            for (let i = 0; i < value.length; i++) {
              const element = value[i];
              let contentHTML = this.formatStringToHTMLAllReferences(Chtml, '__method__', key);
              contentHTML = this.formatStringToHTMLInArray(contentHTML, '__description__', element["Description"]);
              contentHTML = this.formatStringToHTML(contentHTML, '__path__', element["exact_route"]);
              sectionHTML.appendChild(contentHTML);

              const resValue = element["responses"];
              const tableBODY = contentHTML.querySelector("table .b");
              this.makeTableBody(resValue, tableBODY);
            }
          }
        }
      }
    }
  }
  toggleSection() {
    const section = document.querySelectorAll(".section_content_item_inner");

    section.forEach((item, index) => {
      const header = item.querySelector(".section_content_item_header");
      const body = item.querySelector(".section_content_item_body");

      // body
      const height = body.getBoundingClientRect().height;
      body.setAttribute("data-height", height);
      body.style.height = "0px";

      // header
      header.addEventListener("click", () => {
        const height = body.getAttribute("data-height");
        const active = item.classList.contains("active");

        if (active) {
          body.style.height = "0px";
          item.classList.remove("active");
        } else {
          body.style.height = `${height}px`;
          item.classList.add("active");
        }
      });
    });
  }

  // Utils table
  makeTableBody(datas, body) {
    for (const key in datas) {
      if (Object.hasOwnProperty.call(datas, key)) {
        const data = {
          code: key,
          description: datas[key]["description"],
          example: datas[key]["content"]["application/json"] ? datas[key]["content"]["application/json"]["example"] : undefined,
        };
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="status">${data["code"]}</td>
          <td class="desc">
            <span class="desc">${data["description"]}</span>
            ${data["example"] ? `
              <div class="code-highlight example">
                <pre>${data["example"] ? JSON.stringify(data["example"], null, 2).trim() : ""}</pre>
              </div>
            ` : ``}
          </td>
          <td></td>
        `;
        body.appendChild(tr);
      }
    }
  }

  // Utils html
  formatStringToHTMLAllReferences(stringHTML, varToReplace, value) {
    const newSTR = stringHTML
      .replaceAll(varToReplace, value)

    return newSTR
  }
  formatStringToHTMLInArray(stringHTML, varToReplace, value) {
    const newSTR = stringHTML
      .replace(varToReplace, value)

    return newSTR
  }
  formatStringToHTML(stringHTML, varToReplace, value) {
    const newSTR = stringHTML
      .replace(varToReplace, value)

    return this.writeHTML(newSTR);
  }
  writeHTML(html) {
    const template = document.createElement("template");
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
  }
};

(() => {
  const dataHTML = document.querySelector('#data').innerHTML;
  if (dataHTML === undefined) return;

  new OpenAPI({
    data: dataHTML
  }).init();
})();
