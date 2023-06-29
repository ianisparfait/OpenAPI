class OpenAPI{
  constructor(config) {
    this._config = config;

    this.wrapper = document.querySelector('.wrapper');
    this.wrapperSection = document.querySelector('.wrapper_sections');
    this.wrapperSchemas = document.querySelector('.schemas_list');

    this.data = JSON.parse(this._config.data);

    this.pathRegex = /\/v1\/(.*)/;

    this.sections = [];
  }

  async init() {
    console.log(this.data);
    await this.setupInfos();
    this.makeContent();
    this.makeSchemas();
  }

  // Setup
  async setupInfos() {
    const title = document.querySelector(".wrapper_header_title"),
    version = document.querySelector(".wrapper_header_version"),
    description = document.querySelector(".wrapper_header_description");

    if (title && version) {
      title.innerHTML = this.data["info"]["title"];
      version.innerHTML = `Version: ${this.data["info"]["version"]}`;
      description.innerHTML = this.data["info"]["description"];
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
                    <tbody class="b"></tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const Phtml = `
      <div class="section_content_item_body_parameters">
        <div class="header_inner_section">Parameters</div>
        <div class="item_inner_parameters">
          <table class="item_inner_responses_table">
            <thead>
              <tr>
                <th>Name</th>
                <th class="pl">Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody class="bp"></tbody>
          </table>
        </div>
      </div>
    `;

    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      let sectionHTML = this.formatStringToHTML(Shtml, "__title__", section["title"]);
      this.wrapperSection.appendChild(sectionHTML);

      for (const key in section["content"]) {
        if (Object.hasOwnProperty.call(section["content"], key)) {
          const value = section["content"][key];
          if (!Array.isArray(value)) {
            let contentHTML = this.formatStringToHTMLAllReferences(Chtml, "__method__", key);
            contentHTML = this.formatStringToHTMLInArray(contentHTML, "__description__", value["Description"]);
            contentHTML = this.formatStringToHTML(contentHTML, "__path__", value["exact_route"]);
            sectionHTML.appendChild(contentHTML);

            if (value["parameters"]) {
              let paramHTML = this.formatStringToHTMLWithoutReplacing(Phtml);
              contentHTML.querySelector(".section_content_item_body").prepend(paramHTML);
              this.makeParameters(value["parameters"], contentHTML, section["title"], key);
            }

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

              if (element["parameters"]) {
                let paramHTML = this.formatStringToHTMLWithoutReplacing(Phtml);
                contentHTML.querySelector(".section_content_item_body").prepend(paramHTML);
                this.makeParameters(element["parameters"], contentHTML, section["title"], key);
              }

              const resValue = element["responses"];
              const tableBODY = contentHTML.querySelector("table .b");
              this.makeTableBody(resValue, tableBODY);
            }
          }
        }
      }
    }
    this.toggleSection();
  }
  makeParameters(parameters, contentHTML, name, method) {
    const toAppend = contentHTML.querySelector("table .bp");

    for (let index = 0; index < parameters.length; index++) {
      const param = parameters[index];
      const data = {
        name: param["name"],
        isRequired: param["required"],
        type: param["schema"]["type"],
        in: param["in"],
      };
      this.makeTableBodyParams(data, toAppend, name, method);
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

  makeSchemas() {
    const Shtml = `
      <div class="schemas_list_item">
        <div class="schemas_header">
          <span>__name__</span>
          <i class='bx bx-chevron-down'></i>
        </div>
        <div class="schemas_content">
          <div class="desc_entity">__description__</div>
          <table class="schemas_property">
            <tbody class="schemas_property_tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    const Phtml = `
      <tr>
        <td class="name">__propertyname__</td>
        <td class="infos">
          <span class="type">__propertype__</span>
          <span class="more">__propertymore__</span>
          <span class="desc">__propertydesc__</span>
        </td>
      </tr>
    `;

    const schemas = this.data["components"]["schemas"];
    for (const key in schemas) {
      if (Object.hasOwnProperty.call(schemas, key)) {
        const value = schemas[key];
        let schemasHTML = this.formatStringToHTMLInArray(Shtml, '__name__', key);
        schemasHTML = this.formatStringToHTML(schemasHTML, '__description__', value["description"]);
        this.wrapperSchemas.appendChild(schemasHTML);

        const properties = value["properties"];
        for (const key in properties) {
          if (Object.hasOwnProperty.call(properties, key)) {
            const property = properties[key];
            let propertiesHTML = this.formatStringToHTMLInArray(Phtml, '__propertyname__', key);
            propertiesHTML = this.formatStringToHTMLInArray(propertiesHTML, '__propertype__', property["type"]);
            propertiesHTML = property["maxLength"] ? this.formatStringToHTMLInArray(propertiesHTML, '__propertymore__', `Max length: ${property["maxLength"]}`) : this.formatStringToHTMLInArray(propertiesHTML, '__propertype__', "-");
            propertiesHTML = property["minLength"] ? this.formatStringToHTMLInArray(propertiesHTML, '__propertymore__', `Min length: ${property["minLength"]}`) : this.formatStringToHTMLInArray(propertiesHTML, '__propertype__', "-");
            propertiesHTML = this.formatStringToHTML(propertiesHTML, '__propertydesc__', property["description"]);
            schemasHTML.querySelector(".schemas_property_tbody").appendChild(propertiesHTML);
          }
        }
      }
    }
    this.toggleSchemas();
  }
  toggleSchemas() {
    const schemas = document.querySelectorAll(".schemas_list_item");

    schemas.forEach((item, index) => {
      const header = item.querySelector(".schemas_header"),
        body = item.querySelector(".schemas_content");

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
  makeTableBodyParams(data, body, name, method) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <span class="flex"><span>${data["name"]}</span> ${data["isRequired"] ? `<span class="required">*&nbsp;Required</span>` : `` }</span>
        <span class="type">${data["type"]}</span>
        <span class="in">(${data["in"]})</span>
      </td>
      <td class="desc param">ID of ${name} to ${method}</td>
    `;
    body.appendChild(tr);
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
  formatStringToHTMLWithoutReplacing(stringHTML) {
    return this.writeHTML(stringHTML);
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
