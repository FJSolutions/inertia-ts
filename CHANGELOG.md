# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Todo

## [Unreleased]

## [0.5.1] - 2026-04-24

### Changed

- Added the `prop.description` to the `ValidationResult.errors` and display in
  the pretty-printed output of `formatEnvError`.

## [0.5.0] - 2026-04-24

### Added

- A `utils` module with a `formatEnvError` validation error helper to
  pretty-print all the validation errors.

### Changed

- Moved fully to `npm` for publishing and hosting.

## [0.4.0] - 2026-04-23

### Added

- Groups to the Schema
   - Properties can now be grouped in the output in user-defined sub-objects.

### Changed

- Updated the README to give a proper overview of the library

### Fixed

- Incorrect type inference for Secrets

## [0.3.0] - 2026-04-23

### Changed

- Added generic secrets.
   - The default being string.
   - Supplying a parser provides correct type propagation.

## [0.2.0] - 2026-04-22

### Added

- A secret `prop` whose value will not be exposed accidentally in logging or
  JSON serialization.

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
