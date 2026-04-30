# TODOs

## Add commissions collection back to Decap CMS

Add this block to `public/admin/config.yml` under `collections:`:

```yaml
  - name: commissions
    label: Commissions
    folder: content/commissions
    create: true
    format: json
    extension: json
    slug: "{{slug}}"
    fields:
      - label: Name
        name: name
        widget: object
        fields:
          - { label: Primary Name, name: primary, widget: string }
          - label: Translations
            name: translations
            widget: list
            fields:
              - { label: Language Code, name: language, widget: string, hint: "e.g. en, de, fr" }
              - { label: Name, name: name, widget: string }
      - { label: Founding Year, name: foundingYear, widget: number, required: false, value_type: int }
      - { label: Member Countries, name: memberCountries, widget: list }
      - { label: Sponsoring Institutions, name: sponsoringInstitutions, widget: list, required: false }
      - { label: Key Topics, name: keyTopics, widget: list, required: false }
      - label: Publications
        name: publications
        widget: list
        required: false
        fields:
          - { label: Title, name: title, widget: string }
          - { label: Year, name: year, widget: number, required: false, value_type: int }
          - { label: URL, name: url, widget: string, required: false }
          - label: Format
            name: format
            widget: select
            options: [monograph, proceedings, report, textbook_review, teaching_material, other]
      - { label: Working Groups, name: workingGroups, widget: list, required: false }
      - label: Status
        name: status
        widget: select
        options: [active, dormant, concluded, unknown]
      - label: Chairs
        name: chairs
        widget: list
        required: false
        fields:
          - { label: Name, name: name, widget: string }
          - { label: Country, name: country, widget: string }
          - { label: Affiliation, name: affiliation, widget: string, required: false }
      - { label: Commission URL, name: url, widget: string, required: false }
      - label: Link Status
        name: linkStatus
        widget: select
        options: [working, broken]
      - { label: Site Languages, name: siteLanguages, widget: list, required: false, hint: "e.g. en, de, fr" }
      - { label: Last Archived Snapshot, name: lastArchivedSnapshot, widget: string, required: false }
      - label: Archivable Documents
        name: archivableDocuments
        widget: list
        required: false
        fields:
          - { label: Title, name: title, widget: string }
          - { label: URL, name: url, widget: string }
```
