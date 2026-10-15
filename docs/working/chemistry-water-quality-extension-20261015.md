# AP Chemistry environmental nitrogen extension

**Working draft archived on 15 October 2026.** This is the earlier, prospective fourth-meeting material removed from the main public AP Chemistry case pending selection and analysis of suitable water-quality records. No dataset was retrieved or analysed for the original page. The HTML below preserves the original instructional materials and source references for possible future development. It is not an implemented classroom study.

## Original section 1

```html
<section id="chem-evidence-chain" class="section teaching-case-section chem-environment-extension">
  <div class="section-head"><p class="meta">Proposed fourth-meeting extension</p><h2>Environmental nitrogen beyond the equilibrium model</h2><p>An inquiry into nitrogen measurements and their sources, using published data that would first need to be selected and checked.</p></div>
  <div class="reading teaching-case-prose">
    <p>After examining how a defined gas mixture approaches equilibrium, students could ask what a nitrogen measurement tells us about a much less controlled system. The Haber model describes ammonia formation within a reacting mixture; it cannot predict the concentration of nitrate in a stream. Nitrogen compounds entering waterways may come from fertiliser, manure, wastewater, or other inputs, and their measured concentrations reflect transport and chemical or biological transformations. To investigate those possibilities, students would need evidence about the waterway itself. The <a href="https://www.epa.gov/nutrientpollution/sources-and-solutions" target="_blank" rel="noopener noreferrer">U.S. Environmental Protection Agency's account of nutrient sources</a> provides a starting point for distinguishing possible inputs.</p>
    <p>Students could begin with a published water-quality dataset that specifies location, collection date, units, analytical method, and the chemical species measured. Ammonia or ammonium, nitrate, and total nitrogen are different measurements. Their values cannot be substituted for one another without a defensible chemical and analytical rationale. Speciation of dissolved ammonia is influenced by pH and temperature, while nitrate has different transport and transformation pathways. A single concentration also cannot establish a source, an exposure history, or a health consequence.</p>
    <p>The question students choose would determine which records they need. Comparing sites requires attention to sampling dates, methods, units, and possible upstream inputs. Investigating a source would additionally require evidence about transport and chemical transformations. Those decisions belong early in the exercise, while students can still reconsider which measurements are suitable for the claim they hope to examine.</p>
  </div>
  <div class="teaching-sequence-table-wrap" role="region" aria-label="Matching an environmental chemistry question to evidence" tabindex="0">
    <table class="teaching-sequence-table">
      <thead><tr><th scope="col">Question</th><th scope="col">Evidence needed</th><th scope="col">Claim the evidence would not justify alone</th></tr></thead>
      <tbody>
        <tr><th scope="row">What is measured?</th><td>Named nitrogen species, concentration units, analytical procedure, detection limit, and sampling record.</td><td>That different nitrogen measurements represent an interchangeable quantity.</td></tr>
        <tr><th scope="row">Does concentration vary?</th><td>Comparable observations across sites or times, with sampling conditions and uncertainty documented.</td><td>That one difference identifies a responsible source.</td></tr>
        <tr><th scope="row">What processes might explain it?</th><td>Information about nitrogen inputs, chemical transformations, transport, and relevant environmental conditions.</td><td>That the Haber equilibrium expression predicts concentration in a waterway.</td></tr>
        <tr><th scope="row">Whose question is being asked?</th><td>A clear account of the origin and purpose of the investigation, source provenance, and relevant community perspectives where appropriate.</td><td>That a class can speak for a community without consultation or evidence.</td></tr>
      </tbody>
    </table>
  </div>
  <div class="reading teaching-case-prose">
    <h3>Selecting an investigative question</h3>
    <p>Once students identify suitable records, I would ask them to distinguish the observed pattern from their interpretation of it. They could examine a competing explanation and identify one further measurement that might help. Their responses would guide the next task, whether that meant revisiting the analyte and units, comparing sampling conditions, or evaluating possible sources.</p>
    <p>The investigation also raises a question about who decides what is worth measuring. In a justice-centred advanced chemistry class, students worked with a concern identified in their community (<a href="#chem-ref-morales">Morales-Doyle, 2017</a>). That account makes me attentive to how a question is chosen and with whom findings are shared. My proposed source audit does not involve a comparable community partnership. If a class were to pursue a community concern, the people affected would need a part in shaping the investigation and deciding how its results were communicated.</p>
  </div>
</section>
```

## Original section 2

```html
<section id="chem-public-data" class="section teaching-case-section">
<div class="section-head"><h2>Selecting comparable water-quality records</h2><p>A public data source and a proposed classroom audit of its measurements and metadata.</p></div>
<div class="reading teaching-case-prose">
<p>The <a href="https://www.epa.gov/waterdata/water-quality-data-download">Water Quality Portal</a>, a cooperative data service involving the United States Geological Survey, the Environmental Protection Agency, and the National Water Quality Monitoring Council, provides downloadable water-quality observations from multiple monitoring programs. This is a possible starting point for a real data investigation. Because records originate in different programs, students would need to check sampling methods and metadata before comparing values.</p>
<p>To prepare a usable subset, I would first select one named nitrogen analyte, one result fraction and unit, a defined collection period, and stations with adequate location and sampling metadata. The resulting download would need to retain site identifiers, dates, detection or reporting limits where available, and information about the analytical method. I would inspect missing values and qualifiers before treating a numerical result as comparable. A map of observations does not explain their sources, and proximity to an activity does not alone establish causation.</p>
</div>
<div class="teaching-original-prompt"><p class="meta">Student-facing source audit · Before making a claim</p>
<p>Use the portal documentation to identify the fields that would allow comparison of nitrate measurements from two locations. Record the analyte name, fraction, units, collection dates, methods, and any quality qualifiers. Explain one comparison the selected records might support and two reasons why the records might remain incomparable. Propose one additional observation that could help evaluate a possible source of nitrogen.</p></div>
</section>
```

## Original section 3

```html
<section id="chem-data-protocol" class="section teaching-case-section">
  <div class="section-head"><h2>Retrieving and screening a dataset</h2><p>Teacher preparation protocol for locating, checking, and documenting a suitable nitrate series. The data have not yet been extracted for this page.</p></div>
  <div class="reading teaching-case-prose">
    <p>The retrieval trial begins with the US Geological Survey discrete sample download. The agency's tutorial demonstrates station USGS-04183500 using a phosphorus characteristic, so the availability of suitable nitrate records needs to be checked before the exercise proceeds. The protocol begins with the site's recorded characteristics and collection dates. If nitrate observations are absent, the procedure calls for documenting that result and examining another monitoring location.</p>
    <h3>Retrieval procedure</h3>
    <ol>
      <li>Open the USGS discrete sample download and enter <code>USGS-04183500</code> as the monitoring location. Inspect the site results summary and identify whether nitrate is actually present. Record the site name, agency identifier, query URL, retrieval date, and the available characteristic labels. <strong>Do not proceed to a nitrate trend plot without confirming relevant records.</strong></li>
      <li>Check the exact nitrate characteristic and its chemical reporting basis, such as nitrate reported as nitrogen, only if offered. If the station has no comparable nitrate results, preserve the negative availability result as part of the audit, then find another monitored location by filtering for the specified characteristic in the USGS interface. Record the replacement identifier and repeat the availability check. Do not substitute phosphorus, total nitrogen, or ammonia measurements.</li>
      <li>Restrict the date range to <code>2020-01-01</code> through <code>2024-12-31</code> for this exercise. Download the <em>Full physical chemical</em> CSV profile, retaining original column names and metadata. A historical window is used so that a repeat query has a stable stated boundary; records may still be revised.</li>
      <li>Retain collection date, monitoring location, analyte name, result value, units, fraction or basis, detection qualification, and laboratory method where available. Record missing fields. Exclude results that cannot be compared on a common analyte definition and basis, explaining the exclusions.</li>
      <li>Make a simple date-ordered plot only after screening. Mark non-detects or censored results distinctly and do not silently assign them a concentration of zero. Preserve the raw file separately from any cleaned extract, and report the number of records retained and excluded.</li>
    </ol>
    <p>The student question would be modest. What temporal variation is visible in the screened measurements at this monitoring location, and what can reasonably be inferred about that variation? A single-station series cannot isolate an upstream source or represent the exposure of a whole community. Seasonal patterns would need adequate sampling across years and appropriate consideration of streamflow and sampling conditions.</p>
  </div>
  <div class="teaching-sequence-table-wrap" role="region" aria-label="Reproducible water-quality evidence record template" tabindex="0"><table class="teaching-sequence-table">
    <thead><tr><th scope="col">Evidence record field</th><th scope="col">What to enter after downloading</th><th scope="col">Why it is necessary</th></tr></thead>
    <tbody>
      <tr><th scope="row">Source and retrieval</th><td>Download URL, date retrieved, site ID, original file name</td><td>Enables the query to be revisited and revisions to be identified</td></tr>
      <tr><th scope="row">Analyte definition</th><td>Exact characteristic, chemical reporting basis, fraction, unit</td><td>Prevents mixing results that quantify different substances or fractions</td></tr>
      <tr><th scope="row">Observation metadata</th><td>Collection time/date, result qualifier, detection limit, method if present</td><td>Identifies censored observations and possible comparability problems</td></tr>
      <tr><th scope="row">Screening decision</th><td>Rows retained, rows excluded, reasons and any conversion performed</td><td>Makes the plotted data and exclusions auditable</td></tr>
      <tr><th scope="row">Interpretation</th><td>Observed variation, uncertainty, alternative explanations, next measurement</td><td>Distinguishes description from unsupported source attribution</td></tr>
    </tbody></table></div>
  <div class="teaching-original-prompt"><p class="meta">Assessment after retrieval</p>
  <p>Provide your screened data table, a date-ordered visualization, and a statement of one pattern the observations support. Then identify one possible sampling artefact and one additional kind of evidence needed to examine its cause. Explain whether the dataset supports a claim about a specific source of nitrogen. Cite the query and retrieval date so that a reader can repeat the analysis.</p></div>
  <p class="teaching-evidence-note">Until a nitrate dataset has been retrieved and screened, this remains a source-discovery and data-screening exercise. No measured concentrations, record counts, trends, or community impacts are claimed here.</p>
</section>
```

## Original accompanying source entries

```html
<li>DeCicco, L. A. (n.d.). <em>Introducing read_waterdata_samples</em>. U.S. Geological Survey dataRetrieval documentation. <a href="https://water.code-pages.usgs.gov/dataRetrieval/articles/samples_data.html">Retrieval tutorial</a>.</li>
    <li id="chem-ref-johnstone">Johnstone, A. H. (1991). Why is science difficult to learn? Things are seldom what they seem. <em>Journal of Computer Assisted Learning, 7</em>(2), 75–83. <a href="https://doi.org/10.1111/j.1365-2729.1991.tb00230.x">https://doi.org/10.1111/j.1365-2729.1991.tb00230.x</a></li>
    <li id="chem-ref-morales">Morales-Doyle, D. (2017). Justice-centered science pedagogy: A catalyst for academic achievement and social transformation. <em>Science Education, 101</em>(6), 1034–1060. <a href="https://doi.org/10.1002/sce.21305">https://doi.org/10.1002/sce.21305</a></li>
    <li id="chem-ref-talanquer">Talanquer, V. (2011). Macro, submicro, and symbolic: The many faces of the chemistry “triplet.” <em>International Journal of Science Education, 33</em>(2), 179–195. <a href="https://doi.org/10.1080/09500690903386435">https://doi.org/10.1080/09500690903386435</a></li>
    <li>U.S. Environmental Protection Agency. (n.d.). <i>Water quality data download</i>. <a href="https://www.epa.gov/waterdata/water-quality-data-download">Water Quality Portal access and documentation</a>.</li>
    <li>U.S. Geological Survey. (n.d.). <em>Download discrete sample data</em>. <a href="https://waterdata.usgs.gov/download-samples/">USGS data download</a>.</li>
  
```
