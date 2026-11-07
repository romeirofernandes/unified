# feedback analytics

analytics uses the same project picker as integrations. charts read saved feedback from the existing owner-protected endpoint, with no extra AI request. switching the response period filters receipt timestamps, not the dates people entered in answers. dates and chart buckets use UTC.

## what each chart measures

- response volume: counts received feedback by day, week, month or year, depending on the available time span. missing periods inside that span are zero-filled. receipt dates that cannot be read are excluded from this chart, but remain in all-time totals.
- multiple choice: a horizontal comparison in the form’s option order. options with no answers remain visible, and saved answers for old options are retained.
- slider: counts at each configured value for small scales, or ten value ranges for wider scales. zero is a real answer. average, middle value and range use numeric answers only, and saved values outside the current scale remain included.
- date question: counts the dates people selected, separately from receipt dates. invalid calendar dates are excluded and counted as unusable answers.
- email: valid-address coverage across all responses, plus distinct valid addresses. charts and chart tables never show addresses.
- short text: repeated answers, after letter case and extra spaces are normalized, when there are at most 12 short categories.
- long or varied text: the ten most frequent words after basic English stop-word filtering. a word contributes at most once per answer. counts overlap, so there is no percentage column. these are literal words, not AI themes or sentiment scores. the original answers remain searchable below the chart.

answers to removed questions appear as previous questions because their original labels and types are not stored in feedback documents. analytics does not invent that missing context.

## counts and missing data

answered means a nonempty value was saved. not answered includes absent values, including responses received before a question was added. not usable is a subset of answered values that cannot be read as the expected type. percentages in each question’s data table use usable answers, except email coverage, which uses all responses.

all charts have a data table for exact values and keyboard access. empty questions show an empty state, with no sample observations. chart explanations use at most two short sentences, consistent terms and no contractions, following the requested STE writing style.

## components

Bklit source was installed through `@bklit/bar-chart`, `@bklit/line-chart` and `@bklit/y-axis`. series, axes, grid and tooltips are composed from those registry files. horizontal label bounds were adjusted to use the available left margin. analytics colors use the workspace palette in light and dark modes. reduced motion disables the chart reveals.

- [Bklit chart skill](https://github.com/bklit/bklit-ui/tree/main/skills/bklit-ui)
- [Bklit chart documentation](https://bklit.com/docs/components)
- [ASD-STE100](https://www.asd-ste100.org/STE_faq.html)
