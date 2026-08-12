import { BasePage } from '@/pageObjects/BaseClass/BasePage';

/**
 * BaseTest is a thin wrapper around BasePage to maintain legacy naming.
 * It extends BasePage, exposing its helper methods for tests that import
 * '@/base/BaseTest'.
 */
export class BaseTest extends BasePage {}
