# Balancing the accounting equation

<div class=pagetoc>

<!-- toc -->
</div>

The [Accounting Equation](https://en.wikipedia.org/wiki/Accounting_equation) 
states that Assets and Liabilities always match Equity. Eg: `A - L = E`. 

This suggests that a balance report showing all Asset,
Liability and Equity account balances should show a zero grand
total. With hledger you can check this with a `balance` report like:

```cli
$ hledger balance ^assets ^liabilities ^equity
```

or more easily with the `balancesheetequity` command, which is designed for this:

```cli
$ hledger bse
```

Note, checking the accounting equation is different from checking a
[trial balance](https://en.wikipedia.org/wiki/Trial_balance).
A trial balance just checks that the total inflows and outflows over all accounts are equal,
which can be seen by a zero grand total for `hledger balance`.
Normally this is ensured by hledger's requirement that each individual transaction is balanced,
but some of the same problems noted below apply to this also.

## Common problems
In practice, you will find quite a number of things in real-life
journals can disrupt the accounting equation and cause a non-zero
total. Note, this does not interfere with most day-to-day reporting,
and many PTA users won't notice it as a problem. But, seeing the
correct zero total gives added confidence in your bookkeeping, for
yourself and others you might be sharing reports with.  

Here are some things that disturb the accounting equation, and their solutions:

### 1. Unclosed revenue/expenses
Revenues (income) and expenses are technically part of
equity. In traditional accounting, they should be transferred to an account like
`equity:retained earnings` at the end of each reporting period. 

You could record such transfers in your journal, either manually or
[using the close command](hledger.md#example-retain-earnings>).
Most PTA users don't bother with this.

More conveniently, you can use an account alias to convert revenue/expense accounts to equity temporarily. 
Eg:\
`--alias '/^(revenues|income|expenses)\b/=equity'`

### 2. Unbalanced commodity conversions with @/@@
Currency/commodity conversions using @/@@ notation are unbalanced. You
can rewrite them in balanced form by commenting out the @/@@ price and
adding a pair of equity postings - see [Currency conversion 2](conversion2.html).

Or, use `--infer-equity` to do this temporarily at report time. 

Or, converting all amounts to cost may be another solution - try adding `-B`.

### 3. Rounding error with @ costs and --infer-equity
`--infer-equity` is convenient but it tends to expose inaccuracies in
the recorded @ prices, causing small non-zero values in the total. You
can ignore this, or try to fix it by making @ prices more accurate, or
replace your uses of @ with @@ (?) or equity postings.

### 4. Posting dates
Postings dates different from their transaction's date (`; date:DATE`
or `; [DATE]` notation) cause an imbalance in the accounting equation
between the transaction date and posting date. Usually these unbalanced
periods are short and do not cross a file boundary, so you can just
avoid them when testing the accounting equation.

If they do cross a file boundary, or are inconveniently long, 
fix that by splitting the transaction into two transactions 
which use a pending account, as in
[close and balance assertions](hledger.md#close-and-balance-assertions).

### 5. Unbalanced postings
Unbalanced virtual postings (with parenthesised account names)
create an imbalance by definition; just exclude them from the report with
`-R/--real`. This also excludes balanced virtual postings (with
bracketed account names), but that will probably be harmless.

### 6. Partial reports
Many kinds of report [query](#queries) could exclude some data and disturb the accounting equation.
So, avoid most queries when testing this. If you specify a report start date, be sure to include
balances from previous transactions by adding `-H/--historical`. (Or use the `bse` command, 
which does this automatically.)

## An improved zero total report
Combining these, here is a better command to test the accounting equation for a journal:

```cli
$ hledger bse -R --infer-equity --alias '/^(revenues|income|expenses)\b/=equity' not:desc:'closing balances' --layout tall -f YYYY.journal
```

- `-R` - excludes any unbalanced virtual postings
- `--infer-equity` - balances @/@@ transactions by adding equity postings
- `--alias ...` - moves all revenues/expenses under equity
- `not:desc:...` - excludes any final closing balance transactions that would hide ending balances
- `--layout tall` - improves readability when there are many commodities
- `-f ...` - optional, specifies a file other than the default $LEDGER_FILE
