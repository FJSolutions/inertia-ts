# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Todo

- An error-helper to format the errors into something easily readable if
  `createEnv` is unsuccessful.
- It would be great if I could create sub-objects to logically divide parsed
  properties into.

## [0.2.0] - 2026-04-22

### Added

- A secret `prop` whose value will not be exposed accidentally in logging or JSON serialization.

## [0.1.1] - 2026-04-22

### Changed

- Renamed `field` to `prop`
- Added tests to verify the type inference.
- Started writing documentation
- Created a `pub` task to publish to a local repository.

## [0.0.0] - 2026-04-22

### Added

- Initial `git` commit and version of the library
- Entry point is `createEnv` that takes a schema of `field` definitions which
  are then parsed into a `readonly` object.
- Property schemas for:
   - string
   - number
   - integer
   - boolean
   - url
   - port
   - enum
   - list
