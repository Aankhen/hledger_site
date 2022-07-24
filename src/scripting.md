# Scripting hledger

<div class=pagetoc>

<!-- toc -->
</div>

As a command line program, with plain text data formats, hledger is
easy to extend and customise with scripts and add-on commands.
This page describes some different kinds of scripting you can do around hledger.

For an overview of ready-made scripts you can install, see [Scripts](scripts.html).

Scripts are programs which call other programs to get things done.
They are often (though not always):
- small
- ready to run immediately with no compilation step
- quick to write and modify
- written by you to make your particular tasks easier.

They could be as simple a shell alias remembering the options for a
common report, or a small program automating a more complex operation
such as invoicing.

## Shell aliases

Shell aliases are the simplest type of script.
Their most common use is to save typing, as in the examples below.
(These and most shell examples in these docs are for the popular Bash shell;
translate appropriately if you use a different shell.)

```bash
# ~/finance/bashrc
alias acc='hledger accounts'
alias act='hledger activity'
alias add='hledger add'
alias areg='hledger aregister'
alias bal='hledger balance'
alias close='hledger close'
alias print='hledger print'
alias reg='hledger register'
alias stats='hledger stats'
alias tags='hledger tags'
alias bs='hledger bs'
alias bse='hledger bse'
alias is='hledger is'
alias cf='hledger cashflow'
alias 2020='hledger -f ~/finance/2020.journal'
alias 2019='hledger -f ~/finance/2019.journal'
alias 2018='hledger -f ~/finance/2018.journal'
# ...
alias 2y='hledger -f ~/finance/2year.journal'
alias 3y='hledger -f ~/finance/3year.journal'
alias 4y='hledger -f ~/finance/4year.journal'
alias 5y='hledger -f ~/finance/5year.journal'
alias all='hledger -f ~/finance/all.journal'
```

or to customise hledger's commands:

```bash
alias iadd='hledger-iadd --date-format %Y/%m/%d'
alias ui='hledger-ui --watch'
alias uir='hledger-ui --watch --register'
```

or to remember useful reports:

```bash
alias allone="all --alias '/^([^:]+)(:personal|:business)\b/ = \1' --alias '/^revenues:consulting/=revenues' --alias '/\bwells fargo\b/=wf'"
alias budget='hledger bal --budget'
alias forecast='hledger reg -H date:today- --forecast'
alias tripactivity='hledger act tag:trip -W'
```

## Shell functions

When aliases are too limiting, you can use functions instead:

```bash
alias bassets='bal -H ^assets:business'
alias bdebts='bal -H ^liabilities:business'
alias brevenues='bal ^revenues:business'
alias bexpenses='bal ^expenses:business'

function bsnapshot () { # business balance sheet + year-to-date income statement
 echo Business financial snapshot `date` #+%Y/%m/%d
 echo
 echo Assets today:
 bassets --flat --drop 2 --depth 4 $@
 echo
 echo Debts today:
 bdebts --flat --drop 2 --depth 4 $@
 echo
 echo Revenues this year:
 brevenues --flat --drop 2 --depth 3 $@
 echo
 echo Expenses this year:
 bexpenses --flat --drop 2 --depth 3 $@
 echo
}
```

## Shell scripts

When aliases and functions are too limiting, you can use a shell script file:

```bash
#!/bin/sh
# ~/finance/bin/reports
date
export PATH=/Users/simon/.local/bin:$PATH
export LEDGER_FILE=/Users/simon/finance/2018.journal
/usr/bin/make -s -C /Users/simon/finance reports | /usr/bin/mail -s 'reports' simon
```

## Make

[Makefiles](https://www.gnu.org/software/make/) work well for
collections of simple scripts, especially if related to a particular
directory:

```make
# ~/finance/Makefile

# regular reports, mailed by cron
reports: \
	is \
	time-report \
	todo \

is:
	@echo 'Monthly Income Statement'
	hledger is -M cur:.
	@echo

YEAR:=$(shell date +%Y)
TIMEJOURNAL=time-$(YEAR).journal
HLEDGER=hledger
TIME=$(HLEDGER) --alias "/\./=:" -f $(TIMEJOURNAL)

time-report:
	@echo 'Monthly Time Report'
	$(TIME) bal -MAT -1
	@echo

todo:
	@echo "TODOs in this year's journals"
	@grep TODO $(YEAR)*
	@grep TODO $(YEAR)* | wc -l
	@echo
```

## Add-on commands

If you name scripts hledger-something and make them executable in PATH,
they'll be recognised as [add-on commands](hledger.html#add-on-commands).

Eg here's a simple script which adds `estimatedtax` as a hledger command.
This one is in haskell, but it could be written in any language:

```hs
#!/usr/bin/env runhaskell
-- hledger-estimatedtax.hs
-- Given a gross income amount, estimate the corresponding federal and
-- state taxes based on historical tax per gross income.  These
-- amounts can be posted to your tax liability account, to estimate
-- taxes due from this year's income so far.

import System.Environment
import Text.Printf

-- | How much of taxable income to save for federal & state estimated tax payments,
-- these are usually about right for me
fedrate       = 0.28
staterate     = 0.04

main = do
  taxableincome <- fmap (read . head) getArgs :: IO Int
  let fedtax        = round $ fromIntegral taxableincome * fedrate
      statetax      = round $ fromIntegral taxableincome * staterate
      totaltax      = fedtax + statetax
      posttaxincome = taxableincome - totaltax
  printf (
    "Taxable income:  %5d\n" ++
    "US tax:          %5d\n" ++
    "CA tax:          %5d\n" ++
    "Total tax:       %5d\n" ++
    "Post-tax income: %5d\n")
    taxableincome fedtax statetax totaltax posttaxincome
```

## Haskell scripts

Haskell scripts are the most powerful, as they can call the same
[hledger-lib](https://hackage.haskell.org/package/hledger-lib) and
[hledger](https://hackage.haskell.org/package/hledger) APIs used
internally by hledger.

If you want others (or future-you) to be able to run your scripts
reliably, make them [cabal scripts] or [stack scripts]. stack scripts
are currently best for reliability, performance, and sharing, because they:

- ensure the required GHC version is installed
- ensure the required haskell packages are installed, based on the script's imports
- specify all package versions for more reliable builds
- automatically recompile themselves when changed.

You can run haskell scripts interpreted for easy tweaking and
portability, or compiled for speed and durability. stack scripts
compile themselves when needed and run the compiled version otherwise,
giving the benefits of both.

Example scripts and more tips can be found at:\
<https://github.com/simonmichael/hledger/tree/master/bin/>

Such "scripts" can grow as large and powerful as you need. They are
often a good way to prototype a new command, perhaps to become a
builtin command later on. Currently the code for a script and the code
for a builtin command are laid out differently, so that transition
involves a bit of tedious rework, which we'd like to improve.

[stack scripts]: https://docs.haskellstack.org/en/stable/GUIDE/#writing-independent-and-reliable-scripts
[cabal scripts]: https://cabal.readthedocs.io/en/latest/cabal-commands.html#cabal-v2-run
